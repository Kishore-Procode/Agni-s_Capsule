import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.capsule import Capsule, CapsuleRecipient
from app.models.delivery import DeliveryJob, DeliveryAttempt
from app.workers.delivery_scheduler import delivery_scheduler
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_scheduler_processes_due_capsule(test_db: AsyncSession):
    # Create test user
    user = User(
        email="author.elena@stanford.edu",
        hashed_password=hash_password("Pass123"),
        is_verified=True
    )
    test_db.add(user)
    await test_db.flush()

    # Capsule scheduled 1 minute in the past (due now)
    past_due = datetime.now(timezone.utc) - timedelta(minutes=1)
    capsule = Capsule(
        sender_id=user.id,
        title="Time Reached Capsule",
        ciphertext_base64="Q2lwaGVyVGV4dDEyMw==",
        iv_base64="SVZCYXNlNjQ=",
        status="scheduled",
        delivery_time_utc=past_due,
        original_timezone="UTC",
    )
    test_db.add(capsule)
    await test_db.flush()

    # Add 2 recipients
    rec1 = CapsuleRecipient(capsule_id=capsule.id, email="friend1@stanford.edu", status="pending")
    rec2 = CapsuleRecipient(capsule_id=capsule.id, email="friend2@stanford.edu", status="pending")
    test_db.add_all([rec1, rec2])
    await test_db.flush()

    # Add DeliveryJob
    job = DeliveryJob(
        capsule_id=capsule.id,
        scheduled_for=past_due,
        status="pending",
        idempotency_key=f"idemp-{capsule.id}"
    )
    test_db.add(job)
    await test_db.commit()

    # Execute delivery scheduler logic directly
    await delivery_scheduler._deliver_job(test_db, job)
    await test_db.commit()

    # Verification:
    # 1. Job status is delivered
    assert job.status == "delivered"
    assert job.attempts_count == 1

    # 2. Capsule status is updated to delivered
    await test_db.refresh(capsule)
    assert capsule.status == "delivered"

    # 3. Recipients updated to delivered
    await test_db.refresh(rec1)
    await test_db.refresh(rec2)
    assert rec1.status == "delivered"
    assert rec2.status == "delivered"

    # 4. Individual recipient acknowledgement test:
    # If friend1 acknowledges, friend2 remains delivered/pending acknowledgement!
    rec1.status = "acknowledged"
    rec1.acknowledged_at = datetime.now(timezone.utc)
    await test_db.commit()

    await test_db.refresh(rec1)
    await test_db.refresh(rec2)
    assert rec1.status == "acknowledged"
    assert rec2.status == "delivered"
    assert rec2.acknowledged_at is None

@pytest.mark.asyncio
async def test_scheduler_retry_and_backoff(test_db: AsyncSession):
    # Test retry mechanism
    job = DeliveryJob(
        capsule_id="non-existent-cap",
        scheduled_for=datetime.now(timezone.utc),
        status="pending",
        idempotency_key="idemp-fail-test",
        max_attempts=3
    )
    test_db.add(job)
    await test_db.commit()

    # Attempt 1 failure
    await delivery_scheduler._handle_job_failure(test_db, job, "SMTP Connection Timeout")
    await test_db.commit()

    assert job.attempts_count == 1
    assert job.status == "pending"
    assert job.next_retry_at is not None

    # Attempt 2 failure
    await delivery_scheduler._handle_job_failure(test_db, job, "SMTP Connection Timeout")
    await test_db.commit()

    assert job.attempts_count == 2
    assert job.status == "pending"

    # Attempt 3 failure (max attempts reached)
    await delivery_scheduler._handle_job_failure(test_db, job, "SMTP Connection Timeout")
    await test_db.commit()

    assert job.attempts_count == 3
    assert job.status == "failed"

