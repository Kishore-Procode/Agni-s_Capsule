import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import os

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.api.router import api_router
from app.workers.delivery_scheduler import delivery_scheduler
from app.models.user import User, UserProfile
from app.models.batch import BatchCommunity, BatchMember
from app.models.capsule import Capsule, CapsuleRecipient, CapsuleAttachment
from app.models.storage import StorageConnection
from app.core.security import hash_password

def _ensure_sqlite_columns(sync_conn):
    """Safely adds new columns to SQLite tables if they do not exist."""
    import sqlite3
    raw_conn = sync_conn.connection
    if hasattr(raw_conn, "cursor"):
        cursor = raw_conn.cursor()
        migrations = [
            ("storage_connections", "last_verified_at", "TIMESTAMP"),
            ("storage_connections", "updated_at", "TIMESTAMP"),
            ("capsule_attachments", "google_drive_file_id", "VARCHAR(255)"),
            ("capsule_attachments", "upload_status", "VARCHAR(50) DEFAULT 'pending'"),
        ]
        for table, col, col_type in migrations:
            try:
                cursor.execute(f"PRAGMA table_info({table})")
                cols = [c[1] for c in cursor.fetchall()]
                if cols and col not in cols:
                    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            except Exception:
                pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_sqlite_columns)

    # Seed initial test data if database is fresh
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        res = await session.execute(select(User).filter(User.email == "elena.rostova@gmail.com"))
        if not res.scalar_one_or_none():
            user = User(
                email="elena.rostova@gmail.com",
                hashed_password=hash_password("vaultpassword123"),
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.flush()

            profile = UserProfile(
                user_id=user.id,
                full_name="Elena Rostova",
                department="Computer Science & Engineering",
                graduation_year=2027,
                roll_number="23BCE1042",
                avatar_url="https://lh3.googleusercontent.com/aida-public/AB6AXuDhF0H0BDBICwrS4ZPRC9RH7wUKenievJY46yMtNTkSy5zEMB4SBW2YUPHvtUU--Ar8fQjsSXB9mLgnK0m8ZKIKt_R2uEsvv3CrIL2NCAdh2SP9dkG1ngXSgO7ZOLfLEqY9Lf8CvGrs1i_6c9wsCKsTVUCoxBUYIzAqZftI_NPB6Rilw71kJ5j-JFXFVfEYKpjzxiC6mw4Eg806FrK2sryzXgNYLKkoHxec6uoZnwJB"
            )
            session.add(profile)

            # Add Batch Community
            convocation = datetime(2027, 6, 15, 10, 0, 0, tzinfo=timezone.utc)
            batch = BatchCommunity(
                name="Agni's Batch Capsule Ledger",
                department="Dept. of Computer Science & Engineering",
                graduation_year=2027,
                convocation_date=convocation,
                epoch_id="EPOCH-2027-BTECH-CSE",
                max_storage_bytes=5 * 1024 * 1024 * 1024,
            )
            session.add(batch)
            await session.flush()

            member = BatchMember(
                batch_id=batch.id,
                user_id=user.id,
                roll_number="23BCE1042",
                role="Class Guardian",
                is_verified=True,
            )
            session.add(member)

            # Add initial delivered capsule
            cap = Capsule(
                id="cap-revealed-01",
                sender_id=user.id,
                title="Graduation Eve Letter",
                status="delivered",
                capsule_type="friend",
                ciphertext_base64="QWduaVNWYXVsdENpcGhlclRleHQ=",
                iv_base64="QUdOSUlWQkFTRTY0",
                cipher_algorithm="AES-256-GCM",
                cipher_fingerprint="0x8F92...B3",
                delivery_time_utc=datetime(2026, 3, 28, 10, 0, 0, tzinfo=timezone.utc),
                original_timezone="America/Los_Angeles",
                sealed_at=datetime(2022, 5, 18, 22, 30, 0, tzinfo=timezone.utc),
            )
            session.add(cap)
            await session.flush()

            rec = CapsuleRecipient(
                capsule_id=cap.id,
                email="elena.rostova@gmail.com",
                status="delivered",
            )
            session.add(rec)

            await session.commit()
            print("[Lifespan] Initial database seeded with Cadet Elena Rostova & Batch 2027.")

    # Start delivery scheduler background task
    scheduler_task = asyncio.create_task(delivery_scheduler.start())

    yield

    # Shutdown
    delivery_scheduler.stop()
    scheduler_task.cancel()
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Encrypted digital time-capsule and future-message platform with sovereign Google Drive storage.",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API V1 Router
app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

