// AES-GCM encryption utilities for password sharing

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

async function deriveKey(token: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(token),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plaintext: string, token: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(token, salt);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Pack salt + iv + ciphertext as base64
  const packed = JSON.stringify({
    s: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ct: arrayBufferToBase64(encrypted),
  });
  return btoa(packed);
}

export async function decryptData(encryptedBundle: string, token: string): Promise<string> {
  const packed = JSON.parse(atob(encryptedBundle));
  const salt = new Uint8Array(base64ToArrayBuffer(packed.s));
  const iv = new Uint8Array(base64ToArrayBuffer(packed.iv));
  const ciphertext = base64ToArrayBuffer(packed.ct);

  const key = await deriveKey(token, salt);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Legacy: check if data is old base64-only format (not AES-GCM)
export function isLegacyEncryption(data: string): boolean {
  try {
    const decoded = atob(data);
    const parsed = JSON.parse(decoded);
    // Legacy format: directly decoded JSON with title/username/password
    return parsed.title !== undefined && parsed.password !== undefined;
  } catch {
    return false;
  }
}

export function decodeLegacy(data: string): string {
  return atob(data);
}
