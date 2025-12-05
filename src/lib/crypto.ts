/**
 * Cryptographic utilities for password encryption/decryption
 * Uses Web Crypto API with AES-256-GCM encryption and PBKDF2 key derivation
 */

// Constants for encryption
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

/**
 * Generate a cryptographically secure random ID
 */
export function generateSecureId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive an encryption key from a master password using PBKDF2
 */
async function deriveKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  // Import password as a key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(
  data: string,
  masterPassword: string,
  salt: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const key = await deriveKey(masterPassword, salt);
  const iv = generateIV();

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    dataBuffer
  );

  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(
  encryptedData: string,
  masterPassword: string,
  salt: Uint8Array
): Promise<string> {
  // Decode from base64
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map((char) => char.charCodeAt(0))
  );

  // Extract IV and encrypted data
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);

  const key = await deriveKey(masterPassword, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Hash the master password for verification (stored separately from encryption key)
 */
export async function hashMasterPassword(
  masterPassword: string,
  salt: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  // Combine password + salt
  const combined = new Uint8Array(passwordBuffer.length + salt.length);
  combined.set(passwordBuffer, 0);
  combined.set(salt, passwordBuffer.length);

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = new Uint8Array(hashBuffer);

  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Verify a master password against stored hash
 */
export async function verifyMasterPassword(
  masterPassword: string,
  salt: Uint8Array,
  storedHash: string
): Promise<boolean> {
  const hash = await hashMasterPassword(masterPassword, salt);
  return hash === storedHash;
}

/**
 * Convert Uint8Array to base64 string for storage
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

/**
 * Convert base64 string back to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(
    atob(base64)
      .split('')
      .map((char) => char.charCodeAt(0))
  );
}

/**
 * Encrypt the vault data (groups + passwords)
 */
export async function encryptVault(
  data: { groups: unknown[]; passwords: unknown[] },
  masterPassword: string,
  salt: Uint8Array
): Promise<string> {
  const jsonData = JSON.stringify(data);
  return encrypt(jsonData, masterPassword, salt);
}

/**
 * Decrypt the vault data
 */
export async function decryptVault(
  encryptedData: string,
  masterPassword: string,
  salt: Uint8Array
): Promise<{ groups: unknown[]; passwords: unknown[] }> {
  const jsonData = await decrypt(encryptedData, masterPassword, salt);
  return JSON.parse(jsonData);
}
