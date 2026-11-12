from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone
import secrets
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.capsule import Capsule, CapsuleRecipient, CapsuleKeyEnvelope, CapsuleAttachment
from app.models.delivery import DeliveryJob, OutboxEvent
from app.models.storage import StorageConnection
from app.schemas.capsule import CapsuleCreate, CapsuleSealRequest, CapsuleResponse
from app.services.google_drive_service import google_drive_service
import base64
import json

router = APIRouter(prefix="/capsules", tags=["Capsules"])

@router.get("", response_model=List[CapsuleResponse])
async def list_capsules(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Capsule)
        .options(
            selectinload(Capsule.recipients),
            selectinload(Capsule.attachments)
        )
        .filter(Capsule.sender_id == current_user.id)
        .order_by(Capsule.created_at.desc())
    )

    if status_filter:
        query = query.filter(Capsule.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=CapsuleResponse)
async def create_capsule(
    req: CapsuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    is_sealed = req.ciphertext_base64 is not None and req.delivery_time_utc is not None
    capsule_status = "scheduled" if is_sealed else "draft"

    new_capsule = Capsule(
        sender_id=current_user.id,
        title=req.title,
        ciphertext_base64=req.ciphertext_base64,
        iv_base64=req.iv_base64,
        status=capsule_status,
        capsule_type=req.capsule_type,
        delivery_time_utc=req.delivery_time_utc,
        original_timezone=req.original_timezone,
        cipher_algorithm=req.cipher_algorithm,
        cipher_fingerprint=req.cipher_fingerprint,
        is_batch=req.is_batch,
        batch_id=req.batch_id,
        sealed_at=datetime.now(timezone.utc) if is_sealed else None,
    )
    db.add(new_capsule)
    await db.flush()

    # Add recipients
    envelope_map = {e.recipient_email: e for e in req.envelopes}
    for r in req.recipients:
        rec = CapsuleRecipient(
            capsule_id=new_capsule.id,
            email=r.email,
            status="pending",
        )
        db.add(rec)
        await db.flush()

        env_data = envelope_map.get(r.email)
        if env_data:
            key_env = CapsuleKeyEnvelope(
                capsule_id=new_capsule.id,
                recipient_id=rec.id,
                encrypted_key_base64=env_data.encrypted_key_base64,
                salt_base64=env_data.salt_base64,
                iv_base64=env_data.iv_base64,
                algorithm=env_data.algorithm or "PBKDF2-AES-GCM",
            )
            db.add(key_env)

    # Check if user has an active Google Drive connection to upload encrypted artifacts
    drive_query = select(StorageConnection).filter(
        StorageConnection.user_id == current_user.id,
        StorageConnection.provider == "google_drive",
        StorageConnection.status == "connected"
    )
    drive_res = await db.execute(drive_query)
    drive_conn = drive_res.scalar_one_or_none()

    if drive_conn and is_sealed and req.ciphertext_base64:
        try:
            capsule_blob = json.dumps({
                "capsule_id": new_capsule.id,
                "title": new_capsule.title,
                "ciphertext_base64": req.ciphertext_base64,
                "iv_base64": req.iv_base64,
                "cipher_algorithm": req.cipher_algorithm or "AES-256-GCM",
                "cipher_fingerprint": req.cipher_fingerprint,
                "sealed_at": datetime.now(timezone.utc).isoformat(),
            }).encode("utf-8")

            await google_drive_service.upload_encrypted_file(
                connection=drive_conn,
                db=db,
                file_name=f"capsule_{new_capsule.id}.enc",
                content_bytes=capsule_blob,
                mime_type="application/octet-stream",
                capsule_id=new_capsule.id
            )
        except Exception as e:
            print(f"[Drive Sync Error] Failed to upload encrypted capsule to Google Drive: {e}")

    # Add attachments
    for att in req.attachments:
        drive_file_id = att.google_drive_file_id
        upload_status = "verified" if drive_file_id else "pending"

        if drive_conn and att.content_base64 and not drive_file_id:
            try:
                att_bytes = base64.b64decode(att.content_base64)
                storage_obj = await google_drive_service.upload_encrypted_file(
                    connection=drive_conn,
                    db=db,
                    file_name=f"att_{new_capsule.id}_{att.name}",
                    content_bytes=att_bytes,
                    mime_type=att.mime_type or "application/octet-stream",
                    capsule_id=new_capsule.id
                )
                drive_file_id = storage_obj.google_drive_file_id
                upload_status = "verified"
            except Exception as e:
                print(f"[Drive Sync Error] Failed to upload attachment {att.name}: {e}")
                upload_status = "failed"

        attachment = CapsuleAttachment(
            capsule_id=new_capsule.id,
            name=att.name,
            mime_type=att.mime_type,
            size_bytes=att.size_bytes,
            storage_path=att.storage_path,
            google_drive_file_id=drive_file_id,
            upload_status=upload_status,
            ciphertext_hash=att.ciphertext_hash,
            iv_base64=att.iv_base64,
        )
        db.add(attachment)

    # If scheduled, create transactional delivery job and outbox event
    if is_sealed and req.delivery_time_utc:
        idempotency_key = f"deliv-{new_capsule.id}-{secrets.token_hex(8)}"
        job = DeliveryJob(
            capsule_id=new_capsule.id,
            scheduled_for=req.delivery_time_utc,
            status="pending",
            idempotency_key=idempotency_key,
        )
        db.add(job)

        outbox = OutboxEvent(
            event_type="capsule.scheduled",
            payload_json=f'{{"capsule_id": "{new_capsule.id}", "scheduled_for": "{req.delivery_time_utc.isoformat()}"}}',
            status="pending",
        )
        db.add(outbox)

    await db.commit()

    # Re-fetch with relations
    res = await db.execute(
        select(Capsule)
        .options(selectinload(Capsule.recipients), selectinload(Capsule.attachments))
        .filter(Capsule.id == new_capsule.id)
    )
    return res.scalar_one()

@router.get("/{capsule_id}", response_model=CapsuleResponse)
async def get_capsule(
    capsule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Capsule)
        .options(selectinload(Capsule.recipients), selectinload(Capsule.attachments))
        .filter(Capsule.id == capsule_id, Capsule.sender_id == current_user.id)
    )
    result = await db.execute(query)
    capsule = result.scalar_one_or_none()
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found.")
    return capsule

@router.post("/{capsule_id}/seal", response_model=CapsuleResponse)
async def seal_capsule(
    capsule_id: str,
    req: CapsuleSealRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    capsule = await db.get(Capsule, capsule_id)
    if not capsule or capsule.sender_id != current_user.id:
        raise HTTPException(status_code=404, detail="Capsule not found.")
    
    if capsule.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft capsules can be sealed.")

    capsule.ciphertext_base64 = req.ciphertext_base64
    capsule.iv_base64 = req.iv_base64
    capsule.cipher_fingerprint = req.cipher_fingerprint
    capsule.delivery_time_utc = req.delivery_time_utc
    capsule.original_timezone = req.original_timezone
    capsule.status = "scheduled"
    capsule.sealed_at = datetime.now(timezone.utc)

    # Create delivery job
    idempotency_key = f"deliv-{capsule.id}-{secrets.token_hex(8)}"
    job = DeliveryJob(
        capsule_id=capsule.id,
        scheduled_for=req.delivery_time_utc,
        status="pending",
        idempotency_key=idempotency_key,
    )
    db.add(job)

    await db.commit()

    res = await db.execute(
        select(Capsule)
        .options(selectinload(Capsule.recipients), selectinload(Capsule.attachments))
        .filter(Capsule.id == capsule.id)
    )
    return res.scalar_one()

@router.post("/{capsule_id}/cancel")
async def cancel_capsule(
    capsule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    capsule = await db.get(Capsule, capsule_id)
    if not capsule or capsule.sender_id != current_user.id:
        raise HTTPException(status_code=404, detail="Capsule not found.")

    if capsule.status != "scheduled":
        raise HTTPException(status_code=400, detail="Only scheduled capsules can be cancelled.")

    capsule.status = "cancelled"
    # Mark delivery job cancelled
    await db.execute(
        select(DeliveryJob).filter(DeliveryJob.capsule_id == capsule_id)
    )
    await db.commit()
    return {"status": "success", "message": "Capsule scheduled delivery has been cancelled."}

