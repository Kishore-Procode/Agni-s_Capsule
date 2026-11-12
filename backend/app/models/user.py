from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, BigInteger, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    public_keys = relationship("UserPublicKey", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")
    created_capsules = relationship("Capsule", back_populates="sender", foreign_keys="Capsule.sender_id")
    storage_connections = relationship("StorageConnection", back_populates="user", cascade="all, delete-orphan")
    batch_memberships = relationship("BatchMember", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(1024), nullable=True)
    department = Column(String(255), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    roll_number = Column(String(64), nullable=True)
    bio = Column(Text, nullable=True)

    user = relationship("User", back_populates="profile")


class UserPublicKey(Base):
    __tablename__ = "user_public_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    public_key_pem = Column(Text, nullable=False)
    fingerprint = Column(String(128), unique=True, index=True, nullable=False)
    algorithm = Column(String(32), default="X25519") # X25519 or RSA-OAEP
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="public_keys")


class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_name = Column(String(128), nullable=False)
    device_type = Column(String(32), default="web") # web | android | pwa
    push_endpoint = Column(String(1024), nullable=True)
    push_auth_key = Column(String(255), nullable=True)
    push_p256dh_key = Column(String(255), nullable=True)
    last_active_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="devices")

