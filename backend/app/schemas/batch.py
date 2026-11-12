from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BatchMemberResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    roll_number: str
    role: str
    is_verified: bool
    enrolled_at: datetime

    class Config:
        from_attributes = True

class BatchCommunityResponse(BaseModel):
    id: str
    name: str
    department: str
    graduation_year: int
    convocation_date: datetime
    epoch_id: str
    max_storage_bytes: int
    total_members: int
    group_vaults_count: int
    days_remaining: int
    members: List[BatchMemberResponse] = []

    class Config:
        from_attributes = True

class BatchContributeRequest(BaseModel):
    title: str
    ciphertext_base64: str
    iv_base64: str
    cipher_fingerprint: str
    delivery_time_utc: datetime

