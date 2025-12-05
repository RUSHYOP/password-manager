/**
 * TOTP (Time-based One-Time Password) utilities
 * Implements RFC 6238 for generating TOTP codes
 */

// Base32 alphabet for decoding secrets
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode a Base32 encoded string to Uint8Array
 */
function base32Decode(encoded: string): Uint8Array {
  // Remove spaces and convert to uppercase
  const cleanEncoded = encoded.replace(/\s+/g, '').toUpperCase();
  
  // Remove padding
  const unpadded = cleanEncoded.replace(/=+$/, '');
  
  const bits: number[] = [];
  for (const char of unpadded) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    // Each Base32 character represents 5 bits
    for (let i = 4; i >= 0; i--) {
      bits.push((index >> i) & 1);
    }
  }
  
  // Convert bits to bytes
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  
  return new Uint8Array(bytes);
}

/**
 * Convert a number to a big-endian byte array
 */
function intToBytes(num: number, byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  for (let i = byteLength - 1; i >= 0; i--) {
    bytes[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return bytes;
}

/**
 * Calculate HMAC-SHA1 using Web Crypto API
 */
async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * Calculate HMAC-SHA256 using Web Crypto API
 */
async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * Calculate HMAC-SHA512 using Web Crypto API
 */
async function hmacSha512(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

export type TOTPAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface TOTPOptions {
  secret: string; // Base32 encoded secret
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
  timestamp?: number; // Override current time for testing
}

/**
 * Generate a TOTP code
 */
export async function generateTOTP(options: TOTPOptions): Promise<string> {
  const {
    secret,
    algorithm = 'SHA1',
    digits = 6,
    period = 30,
    timestamp = Date.now(),
  } = options;
  
  // Decode the Base32 secret
  const key = base32Decode(secret);
  
  // Calculate the time counter
  const counter = Math.floor(timestamp / 1000 / period);
  
  // Convert counter to 8-byte big-endian array
  const counterBytes = intToBytes(counter, 8);
  
  // Calculate HMAC based on algorithm
  let hmac: Uint8Array;
  switch (algorithm) {
    case 'SHA256':
      hmac = await hmacSha256(key, counterBytes);
      break;
    case 'SHA512':
      hmac = await hmacSha512(key, counterBytes);
      break;
    case 'SHA1':
    default:
      hmac = await hmacSha1(key, counterBytes);
      break;
  }
  
  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  // Generate OTP
  const otp = binary % Math.pow(10, digits);
  
  // Pad with leading zeros if necessary
  return otp.toString().padStart(digits, '0');
}

/**
 * Get the time remaining until the current TOTP expires
 */
export function getTOTPTimeRemaining(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

/**
 * Verify a TOTP code (with window for clock skew)
 */
export async function verifyTOTP(
  code: string,
  options: TOTPOptions,
  window: number = 1
): Promise<boolean> {
  const { period = 30, timestamp = Date.now() } = options;
  
  // Check codes within the time window
  for (let i = -window; i <= window; i++) {
    const adjustedTimestamp = timestamp + i * period * 1000;
    const expectedCode = await generateTOTP({
      ...options,
      timestamp: adjustedTimestamp,
    });
    
    if (code === expectedCode) {
      return true;
    }
  }
  
  return false;
}

/**
 * Parse an otpauth:// URI
 */
export function parseOTPAuthURI(uri: string): {
  type: 'totp' | 'hotp';
  label: string;
  issuer?: string;
  secret: string;
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
} | null {
  try {
    const url = new URL(uri);
    
    if (url.protocol !== 'otpauth:') {
      return null;
    }
    
    const type = url.hostname as 'totp' | 'hotp';
    if (type !== 'totp' && type !== 'hotp') {
      return null;
    }
    
    // Label is the path without leading slash
    const label = decodeURIComponent(url.pathname.slice(1));
    
    const secret = url.searchParams.get('secret');
    if (!secret) {
      return null;
    }
    
    const issuer = url.searchParams.get('issuer') || undefined;
    const algorithm = (url.searchParams.get('algorithm')?.toUpperCase() as TOTPAlgorithm) || undefined;
    const digits = url.searchParams.get('digits') ? parseInt(url.searchParams.get('digits')!) : undefined;
    const period = url.searchParams.get('period') ? parseInt(url.searchParams.get('period')!) : undefined;
    
    return {
      type,
      label,
      issuer,
      secret,
      algorithm,
      digits,
      period,
    };
  } catch {
    return null;
  }
}

/**
 * Generate an otpauth:// URI for a TOTP entry
 */
export function generateOTPAuthURI(options: {
  label: string;
  secret: string;
  issuer?: string;
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
}): string {
  const { label, secret, issuer, algorithm, digits, period } = options;
  
  let uri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}`;
  
  if (issuer) {
    uri += `&issuer=${encodeURIComponent(issuer)}`;
  }
  if (algorithm && algorithm !== 'SHA1') {
    uri += `&algorithm=${algorithm}`;
  }
  if (digits && digits !== 6) {
    uri += `&digits=${digits}`;
  }
  if (period && period !== 30) {
    uri += `&period=${period}`;
  }
  
  return uri;
}

/**
 * Generate a random TOTP secret (Base32 encoded)
 */
export function generateTOTPSecret(length: number = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  
  // Convert bytes to Base32
  let buffer = 0;
  let bitsLeft = 0;
  
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_ALPHABET[(buffer >> bitsLeft) & 0x1f];
    }
  }
  
  // Handle remaining bits
  if (bitsLeft > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f];
  }
  
  return result;
}
