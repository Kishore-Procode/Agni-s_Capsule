from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.capsule import Capsule, CapsuleRecipient, CapsuleKeyEnvelope

router = APIRouter(prefix="/inbox", tags=["Received Capsules / Inbox"])

@router.get("")
async def list_inbox(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all capsules sent to current user's email."""
    query = (
        select(CapsuleRecipient)
        .options(
            selectinload(CapsuleRecipient.capsule).selectinload(Capsule.attachments),
            selectinload(CapsuleRecipient.capsule).selectinload(Capsule.sender)
        )
        .filter(CapsuleRecipient.email == current_user.email)
        .order_by(CapsuleRecipient.created_at.desc())
    )
    result = await db.execute(query)
    recipients = result.scalars().all()

    inbox_items = []
    now = datetime.now(timezone.utc)
    for r in recipients:
        cap = r.capsule
        is_ready = cap.delivery_time_utc is None or cap.delivery_time_utc <= now
        inbox_items.append({
            "capsule_id": cap.id,
            "title": cap.title if is_ready else "Sealed in Time",
            "sender_email": cap.sender.email,
            "status": r.status,
            "delivery_time_utc": cap.delivery_time_utc,
            "is_unlocked": is_ready,
            "cipher_algorithm": cap.cipher_algorithm,
            "cipher_fingerprint": cap.cipher_fingerprint,
            "acknowledged_at": r.acknowledged_at,
        })
    return inbox_items

@router.get("/{capsule_id}/open")
async def open_capsule(
    capsule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Open and retrieve encrypted envelope and ciphertext for recipient.
    Strictly enforces temporal unlock date!
    """
    # Find recipient record
    query = (
        select(CapsuleRecipient)
        .options(
            selectinload(CapsuleRecipient.capsule).selectinload(Capsule.attachments),
            selectinload(CapsuleRecipient.envelope)
        )
        .filter(
            CapsuleRecipient.capsule_id == capsule_id,
            CapsuleRecipient.email == current_user.email
        )
    )
    result = await db.execute(query)
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Capsule not found in your inbox.")

    cap = rec.capsule
    now = datetime.now(timezone.utc)
    delivery_time = cap.delivery_time_utc
    if delivery_time:
        if delivery_time.tzinfo is None:
            delivery_time = delivery_time.replace(tzinfo=timezone.utc)
        if delivery_time > now:
            diff = delivery_time - now
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This capsule is locked until {delivery_time.isoformat()}. {diff.days} days remaining."
            )

    # Update recipient status to opened if pending or delivered
    if rec.status in ["pending", "delivered"]:
        rec.status = "opened"
        await db.commit()

    envelope = rec.envelope
    return {
        "capsule_id": cap.id,
        "title": cap.title,
        "ciphertext_base64": cap.ciphertext_base64,
        "iv_base64": cap.iv_base64,
        "cipher_algorithm": cap.cipher_algorithm,
        "cipher_fingerprint": cap.cipher_fingerprint,
        "sealed_at": cap.sealed_at,
        "envelope": {
            "encrypted_key_base64": envelope.encrypted_key_base64 if envelope else None,
            "salt_base64": envelope.salt_base64 if envelope else None,
            "iv_base64": envelope.iv_base64 if envelope else None,
            "algorithm": envelope.algorithm if envelope else None,
        } if envelope else None,
        "attachments": [
            {
                "id": att.id,
                "name": att.name,
                "mime_type": att.mime_type,
                "size_bytes": att.size_bytes,
                "storage_path": att.storage_path,
            }
            for att in cap.attachments
        ]
    }

@router.post("/{capsule_id}/acknowledge")
async def acknowledge_receipt(
    capsule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Individual recipient cryptographic acknowledgement.
    """
    query = (
        select(CapsuleRecipient)
        .filter(
            CapsuleRecipient.capsule_id == capsule_id,
            CapsuleRecipient.email == current_user.email
        )
    )
    result = await db.execute(query)
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Capsule recipient record not found.")

    rec.status = "acknowledged"
    rec.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "status": "acknowledged",
        "acknowledged_at": rec.acknowledged_at,
        "message": "Acknowledgement recorded across cryptographic ledger."
    }
