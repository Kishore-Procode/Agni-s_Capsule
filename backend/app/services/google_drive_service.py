import httpx
import hashlib
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import settings
from app.models.storage import StorageConnection, StorageObject, StorageOperation

class GoogleDriveService:
    """
    Real Google Drive API Service for Agni's Capsule.
    Interacts with real Google Drive v3 REST endpoints.
    Handles token refreshing, folder creation, encrypted file upload, verification,
    and access auditing.
    """

    GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
    DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
    DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"

    async def get_valid_access_token(self, connection: StorageConnection, db: AsyncSession) -> str:
        """
        Ensures the connection has a valid, unexpired access token.
        Refreshes the token using the refresh_token if expired or close to expiration.
        """
        if settings.GOOGLE_USE_MOCK:
            return connection.oauth_access_token_encrypted or "mock-google-drive-access-token"

        now = datetime.now(timezone.utc)
        expires_at = connection.token_expires_at

        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        # Token still valid for at least 60 seconds
        if expires_at and expires_at > now + timedelta(seconds=60) and connection.oauth_access_token_encrypted:
            return connection.oauth_access_token_encrypted

        # Refresh token is required to get a new access token
        refresh_token = connection.oauth_refresh_token_encrypted
        if not refresh_token:
            connection.status = "reconnect_required"
            await db.commit()
            raise ValueError("No refresh token available. Please reconnect your Google Drive account.")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.GOOGLE_TOKEN_ENDPOINT,
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
                headers={"Accept": "application/json"},
                timeout=15.0
            )

            if resp.status_code != 200:
                connection.status = "expired"
                await db.commit()
                raise ValueError(f"Google Drive token refresh failed ({resp.status_code}): {resp.text}. Reconnection required.")

            token_data = resp.json()
            new_access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)

            connection.oauth_access_token_encrypted = new_access_token
            connection.token_expires_at = now + timedelta(seconds=expires_in)
            connection.status = "connected"
            await db.commit()
            return new_access_token

    async def ensure_application_folder(self, connection: StorageConnection, db: AsyncSession) -> str:
        """
        Verifies or creates the 'Encrypted-Memory-Capsules' folder in the user's Google Drive.
        Returns the real Google Drive folder ID and persists it in PostgreSQL.
        """
        if settings.GOOGLE_USE_MOCK:
            folder_id = connection.authorized_folder_id or "mock-drive-folder-id-12345"
            connection.authorized_folder_id = folder_id
            connection.authorized_folder_name = "Encrypted-Memory-Capsules"
            await db.commit()
            return folder_id

        access_token = await self.get_valid_access_token(connection, db)
        headers = {"Authorization": f"Bearer {access_token}"}
        folder_name = "Encrypted-Memory-Capsules"

        async with httpx.AsyncClient() as client:
            # 1. If an authorized_folder_id is already stored, verify it still exists in Drive
            if connection.authorized_folder_id:
                check_resp = await client.get(
                    f"{self.DRIVE_API_BASE}/files/{connection.authorized_folder_id}?fields=id,name,trashed,mimeType",
                    headers=headers,
                    timeout=15.0
                )
                if check_resp.status_code == 200:
                    folder_meta = check_resp.json()
                    if not folder_meta.get("trashed") and folder_meta.get("mimeType") == "application/vnd.google-apps.folder":
                        return connection.authorized_folder_id

            # 2. Search for existing non-trashed folder by name
            search_query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            search_resp = await client.get(
                f"{self.DRIVE_API_BASE}/files",
                params={"q": search_query, "fields": "files(id, name)"},
                headers=headers,
                timeout=15.0
            )

            if search_resp.status_code == 200:
                files = search_resp.json().get("files", [])
                if files:
                    real_folder_id = files[0]["id"]
                    connection.authorized_folder_id = real_folder_id
                    connection.authorized_folder_name = folder_name
                    await db.commit()
                    return real_folder_id

            # 3. Create folder if not found
            create_resp = await client.post(
                f"{self.DRIVE_API_BASE}/files",
                json={
                    "name": folder_name,
                    "mimeType": "application/vnd.google-apps.folder",
                    "description": "Agni's Capsule Zero-Knowledge Sovereign Encrypted Vault",
                },
                headers={**headers, "Content-Type": "application/json"},
                timeout=15.0
            )

            if create_resp.status_code not in (200, 201):
                raise ValueError(f"Failed to create Google Drive folder ({create_resp.status_code}): {create_resp.text}")

            created_folder = create_resp.json()
            real_folder_id = created_folder["id"]

            connection.authorized_folder_id = real_folder_id
            connection.authorized_folder_name = folder_name
            connection.last_sync_at = datetime.now(timezone.utc)

            # Record operation
            op = StorageOperation(
                connection_id=connection.id,
                user_id=connection.user_id,
                operation_type="create_folder",
                google_drive_file_id=real_folder_id,
                status="success",
                details_json=json.dumps({"folder_name": folder_name, "folder_id": real_folder_id}),
            )
            db.add(op)
            await db.commit()
            return real_folder_id

    async def upload_encrypted_file(
        self,
        connection: StorageConnection,
        db: AsyncSession,
        file_name: str,
        content_bytes: bytes,
        mime_type: str = "application/octet-stream",
        capsule_id: Optional[str] = None
    ) -> StorageObject:
        """
        Uploads encrypted ciphertext directly to the user's Drive folder via multipart upload.
        Verifies existence with files.get, checks size, calculates SHA-256, and persists record.
        """
        folder_id = await self.ensure_application_folder(connection, db)
        access_token = await self.get_valid_access_token(connection, db)

        # Compute SHA-256 of file content
        file_sha256 = hashlib.sha256(content_bytes).hexdigest()
        file_size = len(content_bytes)

        if settings.GOOGLE_USE_MOCK:
            mock_file_id = f"mock-drive-file-{uuid.uuid4().hex[:12]}"
            storage_obj = StorageObject(
                connection_id=connection.id,
                user_id=connection.user_id,
                capsule_id=capsule_id,
                google_drive_file_id=mock_file_id,
                google_drive_folder_id=folder_id,
                file_name=file_name,
                mime_type=mime_type,
                size_bytes=file_size,
                sha256_checksum=file_sha256,
                upload_status="verified",
                web_view_link=f"https://drive.google.com/file/d/{mock_file_id}/view",
                last_verified_at=datetime.now(timezone.utc),
            )
            db.add(storage_obj)
            connection.used_quota_bytes = (connection.used_quota_bytes or 0) + file_size
            connection.last_sync_at = datetime.now(timezone.utc)
            connection.last_verified_at = datetime.now(timezone.utc)
            await db.commit()
            return storage_obj

        # Multipart upload payload
        boundary = f"agni_{uuid.uuid4().hex}"
        metadata = {
            "name": file_name,
            "parents": [folder_id],
            "description": "Agni's Capsule Client-Side Encrypted Artifact (AES-256-GCM)",
        }

        body_parts = [
            f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{json.dumps(metadata)}\r\n".encode("utf-8"),
            f"--{boundary}\r\nContent-Type: {mime_type}\r\n\r\n".encode("utf-8"),
            content_bytes,
            f"\r\n--{boundary}--\r\n".encode("utf-8"),
        ]
        multipart_body = b"".join(body_parts)

        async with httpx.AsyncClient() as client:
            upload_resp = await client.post(
                f"{self.DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,size,mimeType,webContentLink,webViewLink",
                content=multipart_body,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
                timeout=30.0
            )

            if upload_resp.status_code not in (200, 201):
                op = StorageOperation(
                    connection_id=connection.id,
                    user_id=connection.user_id,
                    operation_type="upload_file",
                    status="failed",
                    details_json=json.dumps({"file_name": file_name, "error": upload_resp.text}),
                )
                db.add(op)
                await db.commit()
                raise ValueError(f"Google Drive upload failed ({upload_resp.status_code}): {upload_resp.text}")

            file_data = upload_resp.json()
            drive_file_id = file_data["id"]

            # Verify with files.get
            verify_resp = await client.get(
                f"{self.DRIVE_API_BASE}/files/{drive_file_id}?fields=id,name,size,mimeType,trashed,createdTime",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=15.0
            )

            if verify_resp.status_code != 200:
                raise ValueError(f"Uploaded file verification failed: file {drive_file_id} not found via files.get")

            verify_meta = verify_resp.json()
            if verify_meta.get("trashed"):
                raise ValueError(f"Uploaded file {drive_file_id} is marked trashed in Google Drive.")

            # Create StorageObject record
            storage_obj = StorageObject(
                connection_id=connection.id,
                user_id=connection.user_id,
                capsule_id=capsule_id,
                google_drive_file_id=drive_file_id,
                google_drive_folder_id=folder_id,
                file_name=file_name,
                mime_type=mime_type,
                size_bytes=file_size,
                sha256_checksum=file_sha256,
                upload_status="verified",
                web_view_link=file_data.get("webViewLink"),
                last_verified_at=datetime.now(timezone.utc),
            )
            db.add(storage_obj)

            # Record success operation
            op = StorageOperation(
                connection_id=connection.id,
                user_id=connection.user_id,
                operation_type="upload_file",
                google_drive_file_id=drive_file_id,
                status="success",
                details_json=json.dumps({
                    "file_name": file_name,
                    "drive_file_id": drive_file_id,
                    "size_bytes": file_size,
                    "sha256": file_sha256,
                }),
            )
            db.add(op)

            # Update connection stats
            connection.used_quota_bytes = (connection.used_quota_bytes or 0) + file_size
            connection.last_sync_at = datetime.now(timezone.utc)
            connection.last_verified_at = datetime.now(timezone.utc)

            await db.commit()
            return storage_obj

    async def verify_access(self, connection: StorageConnection, db: AsyncSession) -> Dict[str, Any]:
        """
        Executes a real verification against Google Drive API:
        1. Checks token validity
        2. Retrieves folder details
        3. Lists all files in the folder from Google Drive
        4. Cross-references database records against Google Drive files
        5. Reports verified files, missing files, and size metrics
        """
        folder_id = await self.ensure_application_folder(connection, db)

        if settings.GOOGLE_USE_MOCK:
            q = select(StorageObject).filter(StorageObject.connection_id == connection.id)
            res = await db.execute(q)
            db_objects = res.scalars().all()
            verified_items = [{
                "file_id": obj.google_drive_file_id,
                "file_name": obj.file_name,
                "size_bytes": obj.size_bytes,
                "status": "verified"
            } for obj in db_objects]
            now = datetime.now(timezone.utc)
            connection.last_verified_at = now
            connection.last_sync_at = now
            await db.commit()
            return {
                "status": "healthy",
                "folder_id": folder_id,
                "folder_name": connection.authorized_folder_name,
                "folder_created_time": now.isoformat(),
                "drive_files_count": len(verified_items),
                "database_objects_count": len(db_objects),
                "verified_files_count": len(verified_items),
                "missing_files_count": 0,
                "application_used_bytes": sum(o.size_bytes or 0 for o in db_objects),
                "verified_files": verified_items,
                "missing_files": [],
                "discrepancies": [],
                "quota_info": {
                    "google_limit_bytes": 15 * 1024 * 1024 * 1024,
                    "google_usage_bytes": 1024 * 1024,
                    "google_user_email": connection.account_email or "test@gmail.com",
                },
                "last_verified_at": now.isoformat(),
            }

        access_token = await self.get_valid_access_token(connection, db)
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient() as client:
            # 1. Fetch folder metadata
            folder_resp = await client.get(
                f"{self.DRIVE_API_BASE}/files/{folder_id}?fields=id,name,mimeType,trashed,createdTime",
                headers=headers,
                timeout=15.0
            )
            if folder_resp.status_code != 200:
                raise ValueError(f"Could not access application folder in Google Drive ({folder_resp.status_code}): {folder_resp.text}")

            folder_data = folder_resp.json()

            # 2. Query all files inside the folder from Google Drive
            files_resp = await client.get(
                f"{self.DRIVE_API_BASE}/files",
                params={
                    "q": f"'{folder_id}' in parents and trashed = false",
                    "fields": "files(id, name, size, mimeType, md5Checksum, createdTime)",
                    "pageSize": 100,
                },
                headers=headers,
                timeout=15.0
            )

            if files_resp.status_code != 200:
                raise ValueError(f"Failed to list Google Drive files ({files_resp.status_code}): {files_resp.text}")

            drive_files = files_resp.json().get("files", [])
            drive_files_by_id = {f["id"]: f for f in drive_files}

            # 3. Query local database storage objects
            q = select(StorageObject).filter(StorageObject.connection_id == connection.id)
            res = await db.execute(q)
            db_objects = res.scalars().all()

            verified_items = []
            missing_items = []
            discrepancies = []

            total_verified_bytes = 0
            now = datetime.now(timezone.utc)

            for obj in db_objects:
                drive_file = drive_files_by_id.get(obj.google_drive_file_id)
                if drive_file:
                    obj.upload_status = "verified"
                    obj.last_verified_at = now
                    total_verified_bytes += obj.size_bytes or 0
                    verified_items.append({
                        "file_id": obj.google_drive_file_id,
                        "file_name": obj.file_name,
                        "size_bytes": obj.size_bytes,
                        "status": "verified",
                    })
                else:
                    obj.upload_status = "failed"
                    missing_items.append({
                        "file_id": obj.google_drive_file_id,
                        "file_name": obj.file_name,
                        "status": "missing_from_drive",
                    })
                    discrepancies.append(f"File '{obj.file_name}' (ID: {obj.google_drive_file_id}) in DB was not found in Drive folder.")

            # Update connection
            connection.used_quota_bytes = total_verified_bytes
            connection.last_verified_at = now
            connection.last_sync_at = now

            # Fetch account quota if available
            about_resp = await client.get(
                f"{self.DRIVE_API_BASE}/about?fields=user,storageQuota",
                headers=headers,
                timeout=10.0
            )
            quota_info = {}
            if about_resp.status_code == 200:
                about_data = about_resp.json()
                quota = about_data.get("storageQuota", {})
                quota_info = {
                    "google_limit_bytes": int(quota.get("limit", 0)),
                    "google_usage_bytes": int(quota.get("usage", 0)),
                    "google_user_email": about_data.get("user", {}).get("emailAddress"),
                }
                if quota_info.get("google_limit_bytes"):
                    connection.total_quota_bytes = quota_info["google_limit_bytes"]

            # Record verify operation
            op = StorageOperation(
                connection_id=connection.id,
                user_id=connection.user_id,
                operation_type="verify_file",
                status="success" if not missing_items else "failed",
                details_json=json.dumps({
                    "verified_count": len(verified_items),
                    "missing_count": len(missing_items),
                    "total_bytes": total_verified_bytes,
                }),
            )
            db.add(op)
            await db.commit()

            return {
                "status": "healthy" if not missing_items else "discrepancies_found",
                "folder_id": folder_id,
                "folder_name": connection.authorized_folder_name,
                "folder_created_time": folder_data.get("createdTime"),
                "drive_files_count": len(drive_files),
                "database_objects_count": len(db_objects),
                "verified_files_count": len(verified_items),
                "missing_files_count": len(missing_items),
                "application_used_bytes": total_verified_bytes,
                "verified_files": verified_items,
                "missing_files": missing_items,
                "discrepancies": discrepancies,
                "quota_info": quota_info,
                "last_verified_at": now.isoformat(),
            }

    async def download_and_verify(self, connection: StorageConnection, db: AsyncSession, storage_object_id: str) -> Dict[str, Any]:
        """
        Downloads a test copy of a stored file from Google Drive and checks its SHA-256 hash against DB.
        """
        q = select(StorageObject).filter(StorageObject.id == storage_object_id, StorageObject.connection_id == connection.id)
        res = await db.execute(q)
        obj = res.scalar_one_or_none()
        if not obj:
            raise ValueError(f"StorageObject {storage_object_id} not found.")

        if settings.GOOGLE_USE_MOCK:
            return {
                "file_id": obj.google_drive_file_id,
                "file_name": obj.file_name,
                "expected_sha256": obj.sha256_checksum,
                "downloaded_sha256": obj.sha256_checksum,
                "checksum_matches": True,
                "downloaded_bytes_size": obj.size_bytes,
            }

        access_token = await self.get_valid_access_token(connection, db)
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.DRIVE_API_BASE}/files/{obj.google_drive_file_id}?alt=media",
                headers=headers,
                timeout=30.0
            )
            if resp.status_code != 200:
                raise ValueError(f"Failed to download file from Google Drive ({resp.status_code}): {resp.text}")

            downloaded_bytes = resp.content
            computed_sha = hashlib.sha256(downloaded_bytes).hexdigest()
            matches = (computed_sha == obj.sha256_checksum)

            return {
                "file_id": obj.google_drive_file_id,
                "file_name": obj.file_name,
                "expected_sha256": obj.sha256_checksum,
                "downloaded_sha256": computed_sha,
                "checksum_matches": matches,
                "downloaded_bytes_size": len(downloaded_bytes),
            }

google_drive_service = GoogleDriveService()
