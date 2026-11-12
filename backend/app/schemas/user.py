from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    department: Optional[str] = "Computer Science & Engineering"
    graduation_year: Optional[int] = 2027
    roll_number: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    roll_number: Optional[str] = None
    is_google_drive_connected: bool = False
    google_drive_email: Optional[str] = None
    public_key_fingerprint: Optional[str] = None

    class Config:
        from_attributes = True

