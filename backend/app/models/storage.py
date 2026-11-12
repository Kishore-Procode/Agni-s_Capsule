from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class StorageConnection(Base):
    __tablename__ = "storage_connections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(32), default="google_drive")  # google_drive | local | s3
    status = Column(String(32), default="disconnected")  # connected | disconnected | expired | reconnect_required
    account_email = Column(String(255), nullable=True)
    oauth_access_token_encrypted = Column(Text, nullable=True)
    oauth_refresh_token_encrypted = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    authorized_folder_id = Column(String(255), nullable=True)
    authorized_folder_name = Column(String(255), default="Encrypted-Memory-Capsules")
    total_quota_bytes = Column(BigInteger, default=0)
    used_quota_bytes = Column(BigInteger, default=0)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="storage_connections")
    objects = relationship("StorageObject", back_populates="connection", cascade="all, delete-orphan")
    operations = relationship("StorageOperation", back_populates="connection", cascade="all, delete-orphan")


class StorageObject(Base):
    __tablename__ = "storage_objects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    connection_id = Column(String(36), ForeignKey("storage_connections.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    capsule_id = Column(String(36), ForeignKey("capsules.id", ondelete="SET NULL"), nullable=True, index=True)
    google_drive_file_id = Column(String(255), nullable=True, index=True)
    google_drive_folder_id = Column(String(255), nullable=True)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(128), default="application/octet-stream")
    size_bytes = Column(BigInteger, default=0)
    sha256_checksum = Column(String(64), nullable=True)
    upload_status = Column(String(32), default="pending")  # pending | verified | failed
    web_view_link = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_verified_at = Column(DateTime(timezone=True), nullable=True)

    connection = relationship("StorageConnection", back_populates="objects")


class StorageOperation(Base):
    __tablename__ = "storage_operations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    connection_id = Column(String(36), ForeignKey("storage_connections.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    operation_type = Column(String(64), nullable=False)  # create_folder | upload_file | verify_file | delete_file
    google_drive_file_id = Column(String(255), nullable=True)
    status = Column(String(32), default="success")  # success | failed
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    connection = relationship("StorageConnection", back_populates="operations")
