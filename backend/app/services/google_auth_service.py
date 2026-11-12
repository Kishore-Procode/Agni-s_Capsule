import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import hash_password, create_access_token, create_refresh_token
from app.models.user import User, UserProfile
from app.models.storage import StorageConnection


class GoogleAuthService:
    """Google OAuth2 service with strict config validation and no silent fallback."""

    GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"

    @staticmethod
    def _is_google_configured() -> bool:
        client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
        client_secret = (settings.GOOGLE_CLIENT_SECRET or "").strip()
        if not client_id or not client_secret:
            return False

        if settings.GOOGLE_USE_MOCK:
            return True

        is_mock_mode = client_id.startswith("mock-") or client_secret.startswith("mock-")
        return not is_mock_mode

    @staticmethod
    def _is_mock_google_mode() -> bool:
        return settings.GOOGLE_USE_MOCK and (settings.GOOGLE_CLIENT_ID or "").strip().startswith("mock-") and (settings.GOOGLE_CLIENT_SECRET or "").strip().startswith("mock-")

    def get_authorization_url(self, purpose: str = "login", state: Optional[str] = None) -> str:
        if not self._is_google_configured():
            raise ValueError(
                "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before enabling Google login."
            )

        state_val = state or f"agni_{purpose}_{int(datetime.now(timezone.utc).timestamp())}"
        redirect_uri = settings.GOOGLE_AUTH_REDIRECT_URI if purpose == "login" else settings.GOOGLE_DRIVE_REDIRECT_URI
        scopes = ["openid", "email", "profile"]
        if purpose in ["drive", "storage"]:
            scopes.append("https://www.googleapis.com/auth/drive.file")

        scope_str = "%20".join(scopes)

        return (
            f"{self.GOOGLE_AUTH_ENDPOINT}?"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scope_str}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={state_val}"
        )

    async def exchange_code_for_user_info(self, code: str, purpose: str = "login") -> Dict[str, Any]:
        if not self._is_google_configured():
            raise ValueError(
                "Google OAuth is not configured. Set real credentials in the environment to enable Google sign-in."
            )

        if self._is_mock_google_mode():
            mock_email = "elena.rostova@gmail.com"
            if "@" in code and not code.startswith("google-auth-test-"):
                mock_email = code
            return {
                "id": "google-sub-10492817294",
                "email": mock_email,
                "verified_email": True,
                "name": "Elena Rostova",
                "given_name": "Elena",
                "family_name": "Rostova",
                "picture": "https://lh3.googleusercontent.com/aida-public/AB6AXuDhF0H0BDBICwrS4ZPRC9RH7wUKenievJY46yMtNTkSy5zEMB4SBW2YUPHvtUU--Ar8fQjsSXB9mLgnK0m8ZKIKt_R2uEsvv3CrIL2NCAdh2SP9dkG1ngXSgO7ZOLfLEqY9Lf8CvGrs1i_6c9wsCKsTVUCoxBUYIzAqZftI_NPB6Rilw71kJ5j-JFXFVfEYKpjzxiC6mw4Eg806FrK2sryzXgNYLKkoHxec6uoZnwJB",
                "tokens": {
                    "access_token": "mock-google-drive-access-token",
                    "refresh_token": "mock-google-drive-refresh-token",
                    "expires_in": 3600,
                    "scope": "openid email profile https://www.googleapis.com/auth/drive.file",
                },
            }

        redirect_uri = settings.GOOGLE_AUTH_REDIRECT_URI if purpose == "login" else settings.GOOGLE_DRIVE_REDIRECT_URI
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                self.GOOGLE_TOKEN_ENDPOINT,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
                headers={"Accept": "application/json"},
            )
            if token_resp.status_code != 200:
                raise ValueError(f"Failed to exchange Google OAuth code: {token_resp.text}")

            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValueError("Google token exchange response did not include an access token.")

            userinfo_resp = await client.get(
                self.GOOGLE_USERINFO_ENDPOINT,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                raise ValueError(f"Failed to fetch Google user info: {userinfo_resp.text}")

            user_info = userinfo_resp.json()
            user_info["tokens"] = token_data
            return user_info

    async def authenticate_or_register_google_user(
        self,
        db: AsyncSession,
        google_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        email = google_data.get("email")
        if not email:
            raise ValueError("No email found in Google account.")

        query = (
            select(User)
            .options(selectinload(User.profile), selectinload(User.storage_connections))
            .filter(User.email == email.lower())
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        tokens = google_data.get("tokens", {})
        avatar_url = google_data.get("picture")
        full_name = google_data.get("name", email.split("@")[0].title())

        if not user:
            user = User(
                email=email.lower(),
                hashed_password=hash_password("google_oauth_authorized_account"),
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()

            profile = UserProfile(
                user_id=user.id,
                full_name=full_name,
                avatar_url=avatar_url,
                department="Computer Science & Engineering",
                graduation_year=2027,
                roll_number="23BCE1042",
            )
            db.add(profile)
        else:
            if user.profile and avatar_url:
                user.profile.avatar_url = avatar_url

        # Note: Google identity sign-in does not request or configure Drive storage.
        # Drive storage authorization is strictly separated and handled via /storage/google/connect.

        await db.commit()

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": full_name,
                "avatar_url": avatar_url,
            },
            "access_token": create_access_token(user.id),
            "refresh_token": create_refresh_token(user.id),
            "token_type": "bearer",
        }


google_auth_service = GoogleAuthService()
