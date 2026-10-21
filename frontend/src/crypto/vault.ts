import { fromBase64, toBase64 } from './base64';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type Sealed = { iv: string; ciphertext: string };
export type Kind = 'entry' | 'todo';

export async function seal(key: CryptoKey, kind: Kind, value: unknown): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // fresh for EVERY save
  const ciphertext = await crypto.subtle.encrypt(
    // additionalData: a to-do's ciphertext can't be swapped in as a journal entry
    { name: 'AES-GCM', iv, additionalData: encoder.encode(kind) },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

// Throws if the key is wrong OR if anyone tampered with the ciphertext
export async function unseal<T>(key: CryptoKey, kind: Kind, sealed: Sealed): Promise<T> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(sealed.iv), additionalData: encoder.encode(kind) },
    key,
    fromBase64(sealed.ciphertext),
  );
  return JSON.parse(decoder.decode(plain)) as T;
}