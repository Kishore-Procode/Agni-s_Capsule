# Cryptography & Security Architecture — Agni's Capsule

## Zero-Knowledge Guarantee
Agni's Capsule is architected so that the backend server, database administrators, and third-party hosting providers cannot decrypt the personal correspondence, voice notes, or photos sealed inside capsules.

## Cryptographic Primitives

| Component | Standard / Algorithm | Parameters |
|---|---|---|
| **Content Encryption** | AES-GCM | 256-bit symmetric key, 12-byte IV, 128-bit authentication tag |
| **Key Derivation** | PBKDF2-HMAC-SHA256 | 100,000 iterations, 16-byte random salt |
| **Key Agreement / Wrapping** | SubtleCrypto WrapKey / PBKDF2 | AES-GCM wrapping of 256-bit capsule keys |
| **Archival Digest** | SHA-256 | 256-bit hex fingerprint string (e.g. `0x8F92...B3`) |
| **Password Storage** | PBKDF2-HMAC-SHA256 / Argon2id | 16-byte cryptographically random salt, 100,000 iterations |
| **Session Tokens** | JWT (HMAC-SHA256) | Short-lived access tokens (24h) + protected 30-day refresh tokens |

## Threat Model & Considerations
1. **Lost Keys**: If an author loses both their account passphrase and all exported recovery key backups, the encrypted ciphertext stored in their vault cannot be unsealed.
2. **Notification Privacy**: Outbound notification payloads (email and push) never contain decrypted plaintext message excerpts or sensitive media. Notifications contain only generic arrival links.
3. **Temporal Enforcement**: The server refuses to serve envelope keys or ciphertexts for unreleased capsules to recipients until `delivery_time_utc <= now`.
4. **Sovereign Drive Permission Scope**: Google Drive OAuth permissions strictly request `https://www.googleapis.com/auth/drive.file`. The app can only see and access files it specifically created inside the user's `/Encrypted-Memory-Capsules` directory.

