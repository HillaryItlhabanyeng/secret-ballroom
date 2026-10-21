import { fromBase64, toBase64 } from './base64';

const PBKDF2_ITERATIONS = 600_000;
const encoder = new TextEncoder();

// authKey proves who you are; kek ("key-encryption key") unwraps the journal key
export type DerivedKeys = { authKey: string; kek: CryptoKey };

export function randomSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

async function derive(secret: string, salt: BufferSource): Promise<DerivedKeys> {
  const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const masterBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    passwordKey,
    256,
  );

  const master = await crypto.subtle.importKey('raw', masterBits, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const hkdf = (info: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encoder.encode(info) });

  const authBits = await crypto.subtle.deriveBits(hkdf('ballroom-auth'), master, 256);
  const kek = await crypto.subtle.deriveKey(hkdf('ballroom-wrap'), master, { name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);

  return { authKey: toBase64(new Uint8Array(authBits)), kek };
}

export const deriveDanceKeys = (steps: number[], salt: BufferSource) => derive(`ballroom-v1:${steps.join('-')}`, salt);
export const deriveRecoveryKeys = (code: string, salt: BufferSource) => derive(`ballroom-recovery-v1:${code}`, salt);

// The one random key that actually locks your journal
export function newJournalKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function wrapJournalKey(journalKey: CryptoKey, kek: CryptoKey): Promise<string> {
  const wrapped = await crypto.subtle.wrapKey('raw', journalKey, kek, 'AES-KW');
  return toBase64(new Uint8Array(wrapped));
}

// extractable = false for daily use; true only during recovery, so it can be wrapped again
export function unwrapJournalKey(wrapped: string, kek: CryptoKey, extractable = false): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey('raw', fromBase64(wrapped), kek, 'AES-KW', { name: 'AES-GCM', length: 256 }, extractable, ['encrypt', 'decrypt']);
}