import importlib

import pytest
from httpx import AsyncClient


def test_mock_google_credentials_are_rejected_by_default(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "mock-google-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "mock-google-client-secret")
    monkeypatch.delenv("GOOGLE_USE_MOCK", raising=False)

    import app.core.config as config_module
    import app.services.google_auth_service as service_module
    importlib.reload(config_module)
    importlib.reload(service_module)

    try:
        assert service_module.google_auth_service._is_google_configured() is False
        with pytest.raises(ValueError, match="not configured"):
            service_module.google_auth_service.get_authorization_url()
    finally:
        monkeypatch.setenv("GOOGLE_USE_MOCK", "true")
        importlib.reload(config_module)
        importlib.reload(service_module)


@pytest.mark.asyncio
async def test_get_google_auth_url(client: AsyncClient):
    res = await client.get("/api/v1/auth/google/url")
    assert res.status_code == 200
    data = res.json()
    assert "auth_url" in data
    assert "accounts.google.com" in data["auth_url"]
    assert "openid" in data["auth_url"]

@pytest.mark.asyncio
async def test_google_auth_callback_login_and_registration(client: AsyncClient):
    # Simulate Google OAuth code callback
    payload = {
        "code": "google-auth-test-code-elena@stanford.edu",
        "state": "agni_state_test_123"
    }
    res = await client.post("/api/v1/auth/google/callback", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "user" in data
    assert data["user"]["email"] == "elena.rostova@gmail.com"
    assert data["user"]["full_name"] == "Elena Rostova"

    # Verify access token works with protected endpoints
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["email"] == "elena.rostova@gmail.com"
    # Drive connection is strictly separated from Google identity login
    assert me["is_google_drive_connected"] is False

@pytest.mark.asyncio
async def test_google_drive_connect_and_disconnect(client: AsyncClient):
    # Register a user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "cadet.drive.tester@stanford.edu",
        "password": "Password123!",
        "full_name": "Drive Tester"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get Google Drive connect URL
    url_res = await client.get("/api/v1/storage/google/connect", headers=headers)
    assert url_res.status_code == 200
    assert "drive.file" in url_res.json()["auth_url"]

    # 2. Complete callback to link Google Drive
    cb_res = await client.post("/api/v1/storage/google/callback", json={
        "code": "mock-drive-code",
        "state": "state-xyz"
    }, headers=headers)
    assert cb_res.status_code == 200
    assert cb_res.json()["status"] == "connected"

    # 3. Verify storage usage is connected
    usage_res = await client.get("/api/v1/storage/usage", headers=headers)
    assert usage_res.status_code == 200
    assert usage_res.json()["is_connected"] is True
    assert usage_res.json()["directory"] == "Encrypted-Memory-Capsules"

    # 4. Test uploading encrypted relic artifact
    test_up = await client.post("/api/v1/storage/google/test-upload", headers=headers)
    assert test_up.status_code == 200
    up_data = test_up.json()
    assert up_data["status"] == "success"
    assert "file_id" in up_data
    assert up_data["checksum_matches"] is True

    # 5. Verify Access audit endpoint
    verify_res = await client.post("/api/v1/storage/google/verify", headers=headers)
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["status"] == "healthy"
    assert v_data["verified_files_count"] >= 1
    assert len(v_data["discrepancies"]) == 0

    # 6. Disconnect Google Drive
    disc_res = await client.post("/api/v1/storage/google/disconnect", headers=headers)
    assert disc_res.status_code == 200
    assert disc_res.json()["status"] == "success"

    # 7. Verify disconnected state
    usage_after = await client.get("/api/v1/storage/usage", headers=headers)
    assert usage_after.status_code == 200
    assert usage_after.json()["is_connected"] is False

    # 8. Reconnect allowed and retains database metadata
    reconnect_res = await client.post("/api/v1/storage/google/callback", json={
        "code": "mock-drive-reconnect-code",
        "state": "state-xyz"
    }, headers=headers)
    assert reconnect_res.status_code == 200
    assert reconnect_res.json()["status"] == "connected"

