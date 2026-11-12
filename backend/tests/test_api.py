import pytest
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Agni's Capsule"

@pytest.mark.asyncio
async def test_auth_register_and_login(client: AsyncClient):
    # 1. Register new cadet
    reg_payload = {
        "email": "cadet.aarav@university.edu",
        "password": "SecurePassword123!",
        "full_name": "Aarav Sharma",
        "department": "Computer Science & Engineering",
        "graduation_year": 2027,
        "roll_number": "23BCE1019"
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    tokens = reg_res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    # 2. Login with credentials
    login_payload = {
        "email": "cadet.aarav@university.edu",
        "password": "SecurePassword123!"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_tokens = login_res.json()
    assert "access_token" in login_tokens

    # 3. Fetch profile with token
    headers = {"Authorization": f"Bearer {login_tokens['access_token']}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "cadet.aarav@university.edu"
    assert me_data["full_name"] == "Aarav Sharma"

@pytest.mark.asyncio
async def test_capsule_create_seal_and_inbox(client: AsyncClient):
    # Setup author
    reg_author = {
        "email": "maya.lin@gmail.com",
        "password": "Password123!",
        "full_name": "Maya Lin"
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_author)
    author_token = reg_res.json()["access_token"]
    author_headers = {"Authorization": f"Bearer {author_token}"}

    # Create & Seal capsule scheduled in future
    unlock_time = datetime.now(timezone.utc) + timedelta(days=365)
    capsule_payload = {
        "title": "Graduation Eve Letter",
        "ciphertext_base64": "U2VjcmV0Q2lwaGVydGV4dERhdGE=",
        "iv_base64": "QUJDRUVGR0hJSktMTU5PUA==",
        "capsule_type": "friend",
        "delivery_time_utc": unlock_time.isoformat(),
        "original_timezone": "America/Los_Angeles",
        "cipher_algorithm": "AES-256-GCM",
        "cipher_fingerprint": "0x8F92...B3",
        "recipients": [
            {"email": "elena.rostova@gmail.com", "name": "Elena Rostova"}
        ],
        "envelopes": [
            {
                "recipient_email": "elena.rostova@gmail.com",
                "encrypted_key_base64": "RW5jcnlwdGVkS2V5QW5h",
                "salt_base64": "U2FsdEhlcmU=",
                "iv_base64": "SVZIZXJl"
            }
        ],
        "attachments": []
    }
    create_res = await client.post("/api/v1/capsules", json=capsule_payload, headers=author_headers)
    assert create_res.status_code == 200
    capsule_data = create_res.json()
    assert capsule_data["title"] == "Graduation Eve Letter"
    assert capsule_data["status"] == "scheduled"
    capsule_id = capsule_data["id"]

    # Register recipient Elena
    reg_recipient = {
        "email": "elena.rostova@gmail.com",
        "password": "Password123!",
        "full_name": "Elena Rostova"
    }
    rec_res = await client.post("/api/v1/auth/register", json=reg_recipient)
    recipient_token = rec_res.json()["access_token"]
    recipient_headers = {"Authorization": f"Bearer {recipient_token}"}

    # Attempt to open locked capsule before delivery time: Expect 403 Forbidden!
    open_res = await client.get(f"/api/v1/inbox/{capsule_id}/open", headers=recipient_headers)
    assert open_res.status_code == 403
    assert "locked until" in open_res.json()["detail"]

@pytest.mark.asyncio
async def test_batch_ledger_and_contribution(client: AsyncClient):
    # Register user first
    reg_user = {
        "email": "cadet.elena@stanford.edu",
        "password": "Password123!",
        "full_name": "Cadet Elena",
        "department": "Computer Science & Engineering",
        "graduation_year": 2027
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_user)
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch batch ledger
    ledger_res = await client.get("/api/v1/batches/default/ledger", headers=headers)
    assert ledger_res.status_code == 200
    ledger = ledger_res.json()
    assert "Agni's Batch Capsule Ledger" in ledger["name"]
    assert ledger["graduation_year"] == 2027
    assert ledger["total_guardians"] == 142
    assert "The 3 AM Hackathon & Bug Graveyard" in ledger["flagship_capsule"]["title"]
