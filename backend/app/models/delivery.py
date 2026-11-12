from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class DeliveryJob(Base):
    """
    Transactional Outbox Delivery Job.
    Processed by background scheduler with FOR UPDATE SKIP LOCKED.
    """
    __tablename__ = "delivery_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    capsule_id = Column(String(36), ForeignKey("capsules.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(32), default="pending", index=True) # pending | processing | delivered | failed
    attempts_count = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    idempotency_key = Column(String(128), unique=True, nullable=False)
    locked_by = Column(String(64), nullable=True)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    capsule = relationship("Capsule", back_populates="delivery_jobs")
    attempts = relationship("DeliveryAttempt", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_job_status_scheduled", "status", "scheduled_for"),
    )


class DeliveryAttempt(Base):
    __tablename__ = "delivery_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("delivery_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(32), default="email") # email | web_push | fcm
    status = Column(String(32), nullable=False) # success | failure | throttled
    response_payload = Column(Text, nullable=True)
    attempted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    job = relationship("DeliveryJob", back_populates="attempts")


class OutboxEvent(Base):
    """
    Guaranteed message delivery outbox pattern.
    """
    __tablename__ = "outbox_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(64), nullable=False, index=True)
    payload_json = Column(Text, nullable=False)
    status = Column(String(32), default="pending", index=True) # pending | processed | failed
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime(timezone=True), nullable=True)

