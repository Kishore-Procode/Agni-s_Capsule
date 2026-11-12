from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, BigInteger, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Capsule(Base):
    __tablename__ = "capsules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    ciphertext_base64 = Column(Text, nullable=True) # None while draft
    iv_base64 = Column(String(64), nullable=True)
    status = Column(String(32), default="draft", index=True) # draft | scheduled | delivered | opened | cancelled
    capsule_type = Column(String(32), default="personal")
    delivery_time_utc = Column(DateTime(timezone=True), nullable=True, index=True)
    original_timezone = Column(String(64), default="UTC")
    cipher_algorithm = Column(String(32), default="AES-256-GCM")
    cipher_fingerprint = Column(String(128), nullable=True)
    is_batch = Column(Boolean, default=False)
    batch_id = Column(String(36), ForeignKey("batch_communities.id", ondelete="SET NULL"), nullable=True, index=True)
    sealed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    sender = relationship("User", back_populates="created_capsules", foreign_keys=[sender_id])
    recipients = relationship("CapsuleRecipient", back_populates="capsule", cascade="all, delete-orphan")
    key_envelopes = relationship("CapsuleKeyEnvelope", back_populates="capsule", cascade="all, delete-orphan")
    attachments = relationship("CapsuleAttachment", back_populates="capsule", cascade="all, delete-orphan")
    delivery_jobs = relationship("DeliveryJob", back_populates="capsule", cascade="all, delete-orphan")
    batch = relationship("BatchCommunity", back_populates="capsules")

    __table_args__ = (
        Index("ix_capsule_status_delivery", "status", "delivery_time_utc"),
    )


class CapsuleRecipient(Base):
    __tablename__ = "capsule_recipients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    capsule_id = Column(String(36), ForeignKey("capsules.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    recipient_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), default="pending") # pending | notified | delivered | opened | acknowledged
    notification_accepted = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    capsule = relationship("Capsule", back_populates="recipients")
    envelope = relationship("CapsuleKeyEnvelope", back_populates="recipient", uselist=False, cascade="all, delete-orphan")
    recipient_user = relationship("User", foreign_keys=[recipient_user_id])


class CapsuleKeyEnvelope(Base):
    __tablename__ = "capsule_key_envelopes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    capsule_id = Column(String(36), ForeignKey("capsules.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(String(36), ForeignKey("capsule_recipients.id", ondelete="CASCADE"), unique=True, nullable=False)
    encrypted_key_base64 = Column(Text, nullable=False)
    salt_base64 = Column(String(64), nullable=True)
    iv_base64 = Column(String(64), nullable=True)
    algorithm = Column(String(32), default="PBKDF2-AES-GCM")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    capsule = relationship("Capsule", back_populates="key_envelopes")
    recipient = relationship("CapsuleRecipient", back_populates="envelope")


class CapsuleAttachment(Base):
    __tablename__ = "capsule_attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    capsule_id = Column(String(36), ForeignKey("capsules.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    mime_type = Column(String(128), nullable=False)
    size_bytes = Column(BigInteger, default=0)
    storage_path = Column(String(1024), nullable=False)
    google_drive_file_id = Column(String(255), nullable=True, index=True)
    upload_status = Column(String(32), default="pending")  # pending | verified | failed
    ciphertext_hash = Column(String(128), nullable=True)
    iv_base64 = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    capsule = relationship("Capsule", back_populates="attachments")

