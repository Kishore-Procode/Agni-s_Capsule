from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class RecipientCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class EnvelopeCreate(BaseModel):
    recipient_email: str
    encrypted_key_base64: str
    salt_base64: Optional[str] = None
    iv_base64: Optional[str] = None
    algorithm: Optional[str] = "PBKDF2-AES-GCM"

class AttachmentCreate(BaseModel):
    name: str
    mime_type: str
    size_bytes: int
    storage_path: str
    content_base64: Optional[str] = None
    google_drive_file_id: Optional[str] = None
    ciphertext_hash: Optional[str] = None
    iv_base64: Optional[str] = None

class CapsuleCreate(BaseModel):
    title: str
    ciphertext_base64: Optional[str] = None
    iv_base64: Optional[str] = None
    capsule_type: str = "personal"
    delivery_time_utc: Optional[datetime] = None
    original_timezone: str = "UTC"
    cipher_algorithm: str = "AES-256-GCM"
    cipher_fingerprint: Optional[str] = None
    is_batch: bool = False
    batch_id: Optional[str] = None
    recipients: List[RecipientCreate] = []
    envelopes: List[EnvelopeCreate] = []
    attachments: List[AttachmentCreate] = []

class CapsuleSealRequest(BaseModel):
    ciphertext_base64: str
    iv_base64: str
    cipher_fingerprint: str
    delivery_time_utc: datetime
    original_timezone: str
    envelopes: List[EnvelopeCreate]

class RecipientResponse(BaseModel):
    id: str
    email: str
    status: str
    notification_accepted: bool
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: str
    name: str
    mime_type: str
    size_bytes: int
    storage_path: str
    google_drive_file_id: Optional[str] = None
    upload_status: Optional[str] = "pending"

    class Config:
        from_attributes = True

class CapsuleResponse(BaseModel):
    id: str
    sender_id: str
    title: str
    ciphertext_base64: Optional[str] = None
    iv_base64: Optional[str] = None
    status: str
    capsule_type: str
    delivery_time_utc: Optional[datetime] = None
    original_timezone: str
    cipher_algorithm: str
    cipher_fingerprint: Optional[str] = None
    is_batch: bool
    batch_id: Optional[str] = None
    created_at: datetime
    recipients: List[RecipientResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True

