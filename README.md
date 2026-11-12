# Agni's Capsule

> **Your memories have a future.**  
> *An encrypted digital time-capsule and future-message platform.*

Built from the Google Stitch **Memory Capsule / Agni's Capsule** design system export, honoring the **Tactile Editorial Antiquarian** aesthetic (aged parchment, wax seals, midnight-iron vaults, and bond certificates) paired with Web Crypto zero-knowledge encryption, transactional outbox delivery, and college batch community hubs.

---

## 🏛️ Features

- **10 Pixel-Faithful Stitch Screens**:
  - `overview_dashboard`: Archival welcome ledger, unopened delivery wax seal break, vault counters, milestones stack, horizon map.
  - `create_seal_capsule`: 4-step archival progression ribbon, rich manuscript canvas, polaroid attachments, voice memo waveform, countdown strip, wax seal button.
  - `my_capsules`: Folded envelope cards, status tabs, search & ciphers.
  - `capsule_reading_experience`: Decrypted chronicle, broken wax seal insignia, letter typography, polaroid keepsake, interactive audio player, recipient acknowledgement.
  - `vault_storage_security`: Google Drive repository integration (`drive.file`), capacity gauge, zero third-party cloud access guarantee, cryptographic key backup.
  - `notification_center`: Deliveries, heartbeat reminders, recipient acknowledgements.
  - `capsule_timeline_milestones`: Vertical dotted chronology spine, epoch scrubber ('23 to '37), batch & personal filters.
  - `batch_2027_cse_hub_desktop`: Full desktop ledger with sidebar navigation, 4-col metric strip, 60/40 hero spotlight (*The 3 AM Hackathon & Bug Graveyard*), registered cadets roster.
  - `batch_2027_cse_hub`: Mobile touch-optimized batch ledger.
  - `vault_keepsake`: Comprehensive design tokens and typography.

- **Zero-Knowledge Client-Side Encryption**:
  - `AES-256-GCM` content encryption via Web Crypto API.
  - Recipient key envelopes with PBKDF2/X25519 key wrapping.
  - Plaintext and private keys never leave the browser.

- **Reliable Transactional Delivery Engine**:
  - Background outbox worker using `FOR UPDATE SKIP LOCKED`.
  - Idempotency keys prevent duplicate dispatches.
  - Exponential backoff retry policies and persistent attempt tracking.
  - Independent per-recipient acknowledgement lifecycles.

- **Sovereign Cloud & Community**:
  - Per-user Google Drive OAuth (`drive.file` scope).
  - Multi-cohort college batch ledgers (configured for B.Tech CSE Batch of 2027).

---

## 🚀 Quick Start (Local Development)

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 2. Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # On Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Run Automated Tests
```bash
# Backend pytest suite
cd backend
.\.venv\Scripts\pytest -v

# Frontend production build & type check
cd frontend
npm run build
```

---

## 🐳 Docker Deployment

Run the complete multi-container stack with PostgreSQL, FastAPI backend, and Nginx-served Vite frontend:

```bash
docker compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- PostgreSQL: `localhost:5432`

---

## 📚 Technical Documentation
- [Architecture Overview](docs/architecture.md)
- [Database Models & Schema](docs/database.md)
- [REST API Specifications](docs/api.md)
- [Security & Cryptography Protocol](docs/security.md)

