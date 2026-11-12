from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.batch import BatchCommunity, BatchMember
from app.models.capsule import Capsule
from app.schemas.batch import BatchCommunityResponse, BatchContributeRequest

router = APIRouter(prefix="/batches", tags=["Batch Community Hub"])

@router.get("", response_model=list[dict])
async def list_batches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BatchCommunity))
    batches = result.scalars().all()
    if not batches:
        # Create default B.Tech CSE Batch of 2027
        convocation = datetime(2027, 6, 15, 10, 0, 0, tzinfo=timezone.utc)
        default_batch = BatchCommunity(
            name="Agni's Batch Capsule Ledger",
            department="Dept. of Computer Science & Engineering",
            graduation_year=2027,
            convocation_date=convocation,
            epoch_id="EPOCH-2027-BTECH-CSE",
            max_storage_bytes=5 * 1024 * 1024 * 1024,
        )
        db.add(default_batch)
        await db.commit()
        batches = [default_batch]

    return [
        {
            "id": b.id,
            "name": b.name,
            "department": b.department,
            "graduation_year": b.graduation_year,
            "convocation_date": b.convocation_date,
            "epoch_id": b.epoch_id,
        }
        for b in batches
    ]

@router.get("/{batch_id}/ledger")
async def get_batch_ledger(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    batch = None
    if batch_id != "default":
        batch = await db.get(BatchCommunity, batch_id)

    if not batch:
        res = await db.execute(select(BatchCommunity))
        batch = res.scalar_one_or_none()

    if not batch:
        convocation = datetime(2027, 6, 15, 10, 0, 0, tzinfo=timezone.utc)
        batch = BatchCommunity(
            name="Agni's Batch Capsule Ledger",
            department="Dept. of Computer Science & Engineering",
            graduation_year=2027,
            convocation_date=convocation,
            epoch_id="EPOCH-2027-BTECH-CSE",
            max_storage_bytes=5 * 1024 * 1024 * 1024,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

    # Calculate days remaining until convocation
    now = datetime.now(timezone.utc)
    conv_date = batch.convocation_date
    if conv_date.tzinfo is None:
        conv_date = conv_date.replace(tzinfo=timezone.utc)
    diff = conv_date - now
    days_left = max(0, diff.days)

    return {
        "id": batch.id,
        "name": batch.name,
        "department": batch.department,
        "graduation_year": batch.graduation_year,
        "convocation_date": batch.convocation_date.strftime("%B %d, %Y"),
        "days_remaining": days_left,
        "epoch_id": batch.epoch_id,
        "total_guardians": 142,
        "group_vaults_sealed": 38,
        "vault_capacity_percent": 94,
        "vault_allocated_gb": 4.7,
        "vault_max_gb": 5.0,
        "flagship_capsule": {
            "title": "The 3 AM Hackathon & Bug Graveyard",
            "unlock_epoch": "Unlocks Jun 2027",
            "time_remaining": "1 year, 2 months (Graduation Night 2027)",
            "hash": "0x7c9f…2027",
            "quote": "Audio recordings of our broken compiler screaming at 4 AM before HackMIT, plus raw terminal logs, merge conflict tears, and our victory cold pizza bills.",
            "contributors_count": 27,
        },
        "members": [
            {"id": "m1", "name": "Elena Rostova", "roll_number": "23BCE1042", "role": "Class Guardian", "sealed_count": 6},
            {"id": "m2", "name": "Maya Lin", "roll_number": "23BCE1008", "role": "Archivist", "sealed_count": 9},
            {"id": "m3", "name": "Aarav Sharma", "roll_number": "23BCE1019", "role": "Cadet Contributor", "sealed_count": 4},
            {"id": "m4", "name": "Priya Venkatesh", "roll_number": "23BCE1055", "role": "Cadet Contributor", "sealed_count": 3},
            {"id": "m5", "name": "Rohan Mehra", "roll_number": "23BCE1087", "role": "Cadet Contributor", "sealed_count": 5},
        ]
    }

@router.post("/{batch_id}/capsules")
async def contribute_to_batch(
    batch_id: str,
    req: BatchContributeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    batch = await db.get(BatchCommunity, batch_id)
    if not batch:
        res = await db.execute(select(BatchCommunity))
        batch = res.scalar_one_or_none()

    new_capsule = Capsule(
        sender_id=current_user.id,
        title=f"[{batch.department if batch else 'CSE'}] {req.title}",
        ciphertext_base64=req.ciphertext_base64,
        iv_base64=req.iv_base64,
        status="scheduled",
        capsule_type="batch",
        delivery_time_utc=req.delivery_time_utc,
        cipher_algorithm="AES-256-GCM",
        cipher_fingerprint=req.cipher_fingerprint,
        is_batch=True,
        batch_id=batch.id if batch else None,
        sealed_at=datetime.now(timezone.utc),
    )
    db.add(new_capsule)
    await db.commit()

    return {
        "status": "success",
        "capsule_id": new_capsule.id,
        "message": "Memory artifact armored and entered into batch ledger quorum."
    }
