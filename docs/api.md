# REST API Documentation — Agni's Capsule

## Base URL
`/api/v1`

## Endpoints

### 1. Authentication
- `POST /auth/register`: Create user account & profile. Returns JWT access & refresh tokens.
- `POST /auth/login`: Authenticate with email & password.
- `POST /auth/refresh`: Refresh access token.
- `GET /auth/me`: Get current authenticated user profile, drive sync status, and public key fingerprint.

### 2. Capsules
- `GET /capsules`: List user's created capsules. Query params: `status` (`draft`, `scheduled`, `delivered`, `opened`).
- `POST /capsules`: Create a draft or sealed capsule with client-side encrypted ciphertext and key envelopes.
- `GET /capsules/{id}`: Retrieve capsule metadata.
- `POST /capsules/{id}/seal`: Arm cryptographic lock and schedule delivery.
- `POST /capsules/{id}/cancel`: Cancel an eligible future scheduled capsule.

### 3. Recipient Inbox
- `GET /inbox`: List capsules sent to the current user's email.
- `GET /inbox/{id}/open`: Fetch envelope ciphertext and attachments. Enforces lock time — returns HTTP 403 Forbidden if accessed before release date.
- `POST /inbox/{id}/acknowledge`: Mark recipient acknowledgement timestamp across the ledger.

### 4. Storage & Sovereign Cloud
- `GET /storage/usage`: Current vault capacity, used footprint, and Google Drive connection state.
- `GET /storage/google/connect`: Generate Google Drive OAuth authorization URL (`drive.file` scope).
- `POST /storage/google/disconnect`: Disconnect Google account.

### 5. Batch Community Hub
- `GET /batches`: List registered batch communities.
- `GET /batches/{id}/ledger`: Cohort overview, 3 AM Hackathon flagship spotlight, member roster, days to convocation.
- `POST /batches/{id}/capsules`: Arm and deposit memory artifact into batch ledger quorum.

### 6. Notifications
- `GET /notifications`: Dispatch alerts, delivery arrivals, heartbeat pulses, and acknowledgements.
- `POST /notifications/{id}/read`: Mark notification read.

