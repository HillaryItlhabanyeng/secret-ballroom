// No I, L, O or U, so it's easy to read back from paper
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = Array.from(bytes, (b) => ALPHABET[b & 31]).join(''); // 32 symbols × 20 = 100 random bits
  return (chars.match(/.{5}/g) ?? []).join('-');
}

// Forgiving typing: lowercase, spaces, dashes, O instead of 0, I or L instead of 1
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
}