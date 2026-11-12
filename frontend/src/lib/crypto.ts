/**
 * Agni's Capsule — Client-Side Zero-Knowledge Cryptography Engine
 * Standards:
 * - AES-256-GCM for content and attachment symmetric encryption
 * - Web Crypto API (SubtleCrypto)
 * - PBKDF2-SHA-256 / HKDF for key derivation
 * - Recipient Key Envelopes
 */

// Convert ArrayBuffer / Uint8Array to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random AES-256-GCM capsule symmetric key
export async function generateCapsuleKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable for envelope wrapping
    ['encrypt', 'decrypt']
  );
}

// Export raw key to base64
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(raw);
}

// Import raw key from base64
export async function importKeyFromBase64(keyBase64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(keyBase64);
  return await window.crypto.subtle.importKey(
    'raw',
    raw.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Generate a random 12-byte IV for AES-GCM
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt UTF-8 text with AES-256-GCM
export async function encryptText(
  text: string,
  key: CryptoKey
): Promise<{ ciphertextBase64: string; ivBase64: string; tagLength: number }> {
  const iv = generateIV();
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
      tagLength: 128,
    },
    key,
    encoded
  );

  return {
    ciphertextBase64: bufferToBase64(ciphertext),
    ivBase64: bufferToBase64(iv),
    tagLength: 128,
  };
}

// Decrypt UTF-8 text with AES-256-GCM
export async function decryptText(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
      tagLength: 128,
    },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Compute SHA-256 hexadecimal hash string for archival fingerprint display
export async function computeSha256Fingerprint(data: string | ArrayBuffer): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `0x${hex.substring(0, 8)}...${hex.substring(hex.length - 4)}`.toUpperCase();
}

// Derive key from passphrase and salt using PBKDF2
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
}

// Wrap capsule key into a recipient envelope using passphrase
export async function createPassphraseEnvelope(
  capsuleKey: CryptoKey,
  recipientPassphrase: string
): Promise<{ encryptedKeyBase64: string; saltBase64: string; ivBase64: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = generateIV();
  const wrappingKey = await deriveKeyFromPassphrase(recipientPassphrase, salt);

  const wrappedKey = await window.crypto.subtle.wrapKey(
    'raw',
    capsuleKey,
    wrappingKey,
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    }
  );

  return {
    encryptedKeyBase64: bufferToBase64(wrappedKey),
    saltBase64: bufferToBase64(salt),
    ivBase64: bufferToBase64(iv),
  };
}

// Unwrap capsule key from envelope using passphrase
export async function unwrapPassphraseEnvelope(
  encryptedKeyBase64: string,
  saltBase64: string,
  ivBase64: string,
  passphrase: string
): Promise<CryptoKey> {
  const salt = base64ToBuffer(saltBase64);
  const iv = base64ToBuffer(ivBase64);
  const wrappedKey = base64ToBuffer(encryptedKeyBase64);
  const unwrappingKey = await deriveKeyFromPassphrase(passphrase, salt);

  return await window.crypto.subtle.unwrapKey(
    'raw',
    wrappedKey.buffer as ArrayBuffer,
    unwrappingKey,
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
