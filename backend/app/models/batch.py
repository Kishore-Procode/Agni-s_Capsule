from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class BatchCommunity(Base):
    __tablename__ = "batch_communities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    graduation_year = Column(Integer, nullable=False, index=True)
    convocation_date = Column(DateTime(timezone=True), nullable=False)
    epoch_id = Column(String(64), unique=True, nullable=False)
    max_storage_bytes = Column(BigInteger, default=5 * 1024 * 1024 * 1024) # 5 GB
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    members = relationship("BatchMember", back_populates="batch", cascade="all, delete-orphan")
    capsules = relationship("Capsule", back_populates="batch")
    invitations = relationship("BatchInvitation", back_populates="batch", cascade="all, delete-orphan")


class BatchMember(Base):
    __tablename__ = "batch_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("batch_communities.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    roll_number = Column(String(64), nullable=False)
    role = Column(String(32), default="Cadet Contributor") # Cadet Contributor | Class Guardian | Archivist
    is_verified = Column(Boolean, default=True)
    enrolled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    batch = relationship("BatchCommunity", back_populates="members")
    user = relationship("User", back_populates="batch_memberships")


class BatchInvitation(Base):
    __tablename__ = "batch_invitations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("batch_communities.id", ondelete="CASCADE"), nullable=False)
    invitation_code = Column(String(64), unique=True, index=True, nullable=False)
    invited_email = Column(String(255), nullable=False)
    is_accepted = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    batch = relationship("BatchCommunity", back_populates="invitations")

