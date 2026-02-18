/**
 * useVaultKey – manages an in-memory AES-GCM CryptoKey derived from the user's
 * vault key token. The raw token is NEVER persisted; only the CryptoKey lives
 * in memory for the duration of the session.
 *
 * For cloud storage the token is derived from the Supabase user-id.
 * For local storage the token is a master-password supplied by the user.
 */

import { useState, useCallback } from 'react';

const PBKDF2_ITERATIONS = 200_000;

// Fixed per-app salt prefix (public, adds domain separation; not a secret).
const APP_SALT_PREFIX = 'securevault-v1-';

async function deriveAesKey(token: string, saltStr: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = encoder.encode(APP_SALT_PREFIX + saltStr);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(token),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ---------- low-level encrypt / decrypt ----------

function ab2b64(buf: ArrayBuffer): string {
  let bin = '';
  new Uint8Array(buf).forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function b642ab(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function encryptWithKey(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const packed = JSON.stringify({ iv: ab2b64(iv.buffer), ct: ab2b64(ciphertext) });
  return btoa(packed);
}

export async function decryptWithKey(bundle: string, key: CryptoKey): Promise<string> {
  const { iv, ct } = JSON.parse(atob(bundle));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(b642ab(iv)) },
    key,
    b642ab(ct)
  );
  return new TextDecoder().decode(decrypted);
}

export function isEncryptedBundle(value: string): boolean {
  try {
    const parsed = JSON.parse(atob(value));
    return typeof parsed.iv === 'string' && typeof parsed.ct === 'string';
  } catch {
    return false;
  }
}

// ---------- hook ----------

interface VaultKeyState {
  cloudKey: CryptoKey | null;
  localKey: CryptoKey | null;
}

let _globalState: VaultKeyState = { cloudKey: null, localKey: null };
let _setters: Array<(s: VaultKeyState) => void> = [];

function notifySetters() {
  _setters.forEach(fn => fn({ ..._globalState }));
}

export function useVaultKey() {
  const [state, setState] = useState<VaultKeyState>({ ..._globalState });

  // Register setter so external changes propagate
  useState(() => {
    _setters.push(setState);
    return () => {
      _setters = _setters.filter(fn => fn !== setState);
    };
  });

  const setCloudKey = useCallback(async (userId: string) => {
    const key = await deriveAesKey(userId, `cloud-${userId}`);
    _globalState = { ..._globalState, cloudKey: key };
    notifySetters();
  }, []);

  const setLocalKey = useCallback(async (masterPassword: string, userId: string) => {
    const key = await deriveAesKey(masterPassword, `local-${userId}`);
    _globalState = { ..._globalState, localKey: key };
    notifySetters();
    // Persist a marker so we know a local key has been set this session
    sessionStorage.setItem('local_vault_unlocked', '1');
  }, []);

  const clearKeys = useCallback(() => {
    _globalState = { cloudKey: null, localKey: null };
    sessionStorage.removeItem('local_vault_unlocked');
    notifySetters();
  }, []);

  const isLocalUnlocked = sessionStorage.getItem('local_vault_unlocked') === '1';

  return {
    cloudKey: state.cloudKey,
    localKey: state.localKey,
    isLocalUnlocked,
    setCloudKey,
    setLocalKey,
    clearKeys,
  };
}
