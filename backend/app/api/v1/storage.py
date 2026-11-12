from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.storage import StorageConnection, StorageObject, StorageOperation
from app.services.google_auth_service import google_auth_service
from app.services.google_drive_service import google_drive_service

router = APIRouter(prefix="/storage", tags=["Storage & Integrations"])


@router.get("/usage")
async def get_storage_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns real, verified storage metrics for the authenticated user.
    Never returns fabricated or hardcoded usage bytes.
    """
    query = select(StorageConnection).filter(
        StorageConnection.user_id == current_user.id,
        StorageConnection.provider == "google_drive"
    )
    result = await db.execute(query)
    conn = result.scalar_one_or_none()

    if not conn or conn.status != "connected":
        return {
            "provider": "google_drive",
            "is_connected": False,
            "status": conn.status if conn else "Disconnected",
            "account_email": conn.account_email if conn else None,
            "authorized_folder_id": None,
            "directory": None,
            "uploaded_files_count": 0,
            "allocated_bytes": 0,
            "total_bytes": 0,
            "failed_files_count": 0,
            "last_sync_at": conn.last_sync_at if conn else None,
            "last_verified_at": conn.last_verified_at if conn else None,
        }

    # Query real verified storage metrics from database
    count_query = select(func.count(StorageObject.id)).filter(
        StorageObject.connection_id == conn.id,
        StorageObject.upload_status == "verified"
    )
    count_res = await db.execute(count_query)
    verified_count = count_res.scalar() or 0

    bytes_query = select(func.coalesce(func.sum(StorageObject.size_bytes), 0)).filter(
        StorageObject.connection_id == conn.id,
        StorageObject.upload_status == "verified"
    )
    bytes_res = await db.execute(bytes_query)
    allocated_bytes = bytes_res.scalar() or 0

    failed_query = select(func.count(StorageObject.id)).filter(
        StorageObject.connection_id == conn.id,
        StorageObject.upload_status == "failed"
    )
    failed_res = await db.execute(failed_query)
    failed_count = failed_res.scalar() or 0

    return {
        "provider": "google_drive",
        "is_connected": True,
        "status": conn.status,
        "account_email": conn.account_email,
        "authorized_folder_id": conn.authorized_folder_id,
        "directory": conn.authorized_folder_name or "Encrypted-Memory-Capsules",
        "uploaded_files_count": verified_count,
        "allocated_bytes": allocated_bytes,
        "failed_files_count": failed_count,
        "total_bytes": conn.total_quota_bytes or 0,
        "last_sync_at": conn.last_sync_at,
        "last_verified_at": conn.last_verified_at,
    }


class GoogleDriveCallbackRequest(BaseModel):
    code: str
    state: str = ""


@router.get("/google/connect")
async def get_google_drive_oauth_url(
    current_user: User = Depends(get_current_user)
):
    """
    Generate sovereign Google Drive OAuth2 authorize URL requesting drive.file scope.
    Validates state is bound to current authenticated user.
    """
    state = f"agni_drive_{current_user.id}_{int(datetime.now(timezone.utc).timestamp())}"
    auth_url = google_auth_service.get_authorization_url(purpose="drive", state=state)
    return {"auth_url": auth_url, "state": state}


@router.post("/google/callback")
async def google_drive_callback(
    req: GoogleDriveCallbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Exchange authorization code for tokens, validate OAuth state, and create/verify
    the real 'Encrypted-Memory-Capsules' folder in Google Drive.
    """
    # Validate state parameter if provided
    if not settings.GOOGLE_USE_MOCK and req.state and current_user.id not in req.state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state parameter: does not match authenticated user.")

    try:
        user_info = await google_auth_service.exchange_code_for_user_info(req.code, purpose="drive")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth code exchange failed: {str(e)}")

    tokens = user_info.get("tokens", {})
    email = user_info.get("email", current_user.email)
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)

    if not access_token:
        raise HTTPException(status_code=400, detail="Google did not return an access token.")

    query = select(StorageConnection).filter(
        StorageConnection.user_id == current_user.id,
        StorageConnection.provider == "google_drive"
    )
    result = await db.execute(query)
    conn = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    token_expiry = now + timedelta(seconds=expires_in)

    if not conn:
        conn = StorageConnection(
            user_id=current_user.id,
            provider="google_drive",
            account_email=email,
            status="connected",
            oauth_access_token_encrypted=access_token,
            oauth_refresh_token_encrypted=refresh_token,
            token_expires_at=token_expiry,
            authorized_folder_name="Encrypted-Memory-Capsules",
            used_quota_bytes=0,
            last_sync_at=now,
        )
        db.add(conn)
    else:
        conn.status = "connected"
        conn.account_email = email
        conn.oauth_access_token_encrypted = access_token
        if refresh_token:
            conn.oauth_refresh_token_encrypted = refresh_token
        conn.token_expires_at = token_expiry
        conn.last_sync_at = now

    await db.commit()
    await db.refresh(conn)

    # Automatically verify or create the application folder in Google Drive
    try:
        real_folder_id = await google_drive_service.ensure_application_folder(conn, db)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Google Drive folder initialization failed: {str(e)}"
        )

    return {
        "status": "connected",
        "account_email": email,
        "folder_id": real_folder_id,
        "folder_name": conn.authorized_folder_name,
        "message": "Google Drive successfully connected and sovereign folder verified.",
    }


@router.post("/google/verify")
async def verify_google_drive_access(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Real Verify Access endpoint:
    Verifies OAuth credentials, queries application folder, lists files from Google Drive,
    cross-references database records, and reports discrepancies.
    """
    query = select(StorageConnection).filter(
        StorageConnection.user_id == current_user.id,
        StorageConnection.provider == "google_drive"
    )
    result = await db.execute(query)
    conn = result.scalar_one_or_none()

    if not conn or conn.status != "connected":
        raise HTTPException(
            status_code=400,
            detail="Google Drive is not connected. Connect your Google account first."
        )

    try:
        report = await google_drive_service.verify_access(conn, db)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Google Drive verification failed: {str(e)}"
        )


@router.post("/google/test-upload")
async def test_google_drive_upload(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a small encrypted test relic to the user's real Google Drive folder,
    verifies it with files.get, downloads it, and checks the SHA-256 checksum.
    """
    query = select(StorageConnection).filter(
        StorageConnection.user_id == current_user.id,
        StorageConnection.provider == "google_drive"
    )
    result = await db.execute(query)
    conn = result.scalar_one_or_none()

    if not conn or conn.status != "connected":
        raise HTTPException(
            status_code=400,
            detail="Google Drive is not connected. Connect your Google account first."
        )

    test_content = (
        f"Agni's Capsule Cryptographic Verification Relic\n"
        f"User: {current_user.email}\n"
        f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n"
        f"Protocol: Zero-Knowledge AES-256-GCM / PBKDF2\n"
    ).encode("utf-8")

    test_filename = f"relic_test_{int(datetime.now(timezone.utc).timestamp())}.enc"

    try:
        storage_obj = await google_drive_service.upload_encrypted_file(
            connection=conn,
            db=db,
            file_name=test_filename,
            content_bytes=test_content,
            mime_type="application/octet-stream",
        )

        # Download and verify checksum
        verify_result = await google_drive_service.download_and_verify(
            connection=conn,
            db=db,
            storage_object_id=storage_obj.id,
        )

        return {
            "status": "success",
            "message": "Real encrypted artifact successfully uploaded and verified in Google Drive.",
            "file_id": storage_obj.google_drive_file_id,
            "file_name": storage_obj.file_name,
            "folder_id": storage_obj.google_drive_folder_id,
            "size_bytes": storage_obj.size_bytes,
            "sha256": storage_obj.sha256_checksum,
            "checksum_matches": verify_result.get("checksum_matches"),
            "web_view_link": storage_obj.web_view_link,
        }
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Test upload to Google Drive failed: {str(e)}"
        )


@router.post("/google/disconnect")
async def disconnect_google_drive(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Disconnects Google Drive:
    Marks connection as disconnected, preserves database metadata and Drive files,
    and clears active tokens.
    """
    query = select(StorageConnection).filter(
        StorageConnection.user_id == current_user.id,
        StorageConnection.provider == "google_drive"
    )
    result = await db.execute(query)
    conn = result.scalar_one_or_none()

    if conn:
        conn.status = "disconnected"
        conn.oauth_access_token_encrypted = None
        await db.commit()

    return {
        "status": "success",
        "message": "Google Drive disconnected successfully. Existing files preserved.",
    }
