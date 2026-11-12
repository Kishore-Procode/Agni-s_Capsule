from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, revoke_refresh_token, is_refresh_token_revoked
from app.models.user import User, UserProfile, UserPublicKey
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserProfileResponse, RefreshTokenRequest, LogoutRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(req: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).filter(User.email == req.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        is_verified=True,
    )
    db.add(new_user)
    await db.flush()

    new_profile = UserProfile(
        user_id=new_user.id,
        full_name=req.full_name,
        department=req.department,
        graduation_year=req.graduation_year,
        roll_number=req.roll_number,
    )
    db.add(new_profile)
    await db.commit()

    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == req.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


from app.services.google_auth_service import google_auth_service
from pydantic import BaseModel


class GoogleOAuthCallbackRequest(BaseModel):
    code: str
    state: str = ""


@router.get("/google/url")
async def get_google_auth_url():
    """Generate Google Sign-In OAuth2 authorization URL when credentials are configured."""
    try:
        url = google_auth_service.get_authorization_url(purpose="login")
        return {"auth_url": url}
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/google/callback")
async def google_auth_callback(
    req: GoogleOAuthCallbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Process Google OAuth code exchange, authenticate user, and issue tokens."""
    try:
        user_info = await google_auth_service.exchange_code_for_user_info(req.code, purpose="login")
        auth_result = await google_auth_service.authenticate_or_register_google_user(db, user_info)
        return auth_result
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(exc)}") from exc


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token.")
    if is_refresh_token_revoked(req.refresh_token):
        raise HTTPException(status_code=401, detail="Refresh token has been revoked.")

    user_id = payload.get("sub")
    result = await db.execute(select(User).filter(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="User not found.")

    revoke_refresh_token(req.refresh_token)
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/logout")
async def logout(req: LogoutRequest, response: Response):
    if req.refresh_token:
        revoke_refresh_token(req.refresh_token)
    response.delete_cookie(key="refresh_token", path="/")
    return {"status": "success", "message": "Logged out successfully."}


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    profile = current_user.profile
    storage_conn = next((s for s in current_user.storage_connections if s.status == "connected"), None)

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=profile.full_name if profile else current_user.email.split("@")[0],
        avatar_url=profile.avatar_url if profile else None,
        department=profile.department if profile else None,
        graduation_year=profile.graduation_year if profile else None,
        roll_number=profile.roll_number if profile else None,
        is_google_drive_connected=storage_conn is not None,
        google_drive_email=storage_conn.account_email if storage_conn else None,
        public_key_fingerprint="0x8F92...B34C",
    )

