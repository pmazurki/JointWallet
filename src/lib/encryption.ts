/**
 * Encryption utilities using Web Crypto API (AES-GCM)
 * Provides secure encryption/decryption for browser storage
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Derives a cryptographic key from a PIN using PBKDF2
 */
async function deriveKeyFromPIN(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  // Import PIN as a raw key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key from PIN
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM with PIN-derived key
 * @returns Base64-encoded string containing: salt + iv + ciphertext
 */
export async function encryptData(data: string, pin: string): Promise<string> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Derive key from PIN
    const key = await deriveKeyFromPIN(pin, salt);

    // Encrypt data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv },
      key,
      dataBuffer
    );

    // Combine salt + iv + ciphertext
    const resultBuffer = new Uint8Array(
      SALT_LENGTH + IV_LENGTH + ciphertext.byteLength
    );
    resultBuffer.set(salt, 0);
    resultBuffer.set(iv, SALT_LENGTH);
    resultBuffer.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

    // Convert to Base64
    return btoa(String.fromCharCode(...resultBuffer));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Nie udało się zaszyfrować danych');
  }
}

/**
 * Decrypts data using AES-GCM with PIN-derived key
 * @param encryptedData Base64-encoded string containing: salt + iv + ciphertext
 * @returns Decrypted plaintext string
 */
export async function decryptData(
  encryptedData: string,
  pin: string
): Promise<string> {
  try {
    // Decode Base64
    const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0)
    );

    // Extract salt, IV, and ciphertext
    const salt = encryptedBuffer.slice(0, SALT_LENGTH);
    const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = encryptedBuffer.slice(SALT_LENGTH + IV_LENGTH);

    // Derive key from PIN
    const key = await deriveKeyFromPIN(pin, salt);

    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv },
      key,
      ciphertext
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Nieprawidłowy PIN lub uszkodzone dane');
  }
}

/**
 * Validates PIN strength
 * @returns true if PIN is valid, error message otherwise
 */
export function validatePIN(pin: string): { valid: boolean; error?: string } {
  if (!pin || pin.length < 4) {
    return { valid: false, error: 'PIN musi mieć co najmniej 4 znaki' };
  }
  if (pin.length > 20) {
    return { valid: false, error: 'PIN może mieć maksymalnie 20 znaków' };
  }
  return { valid: true };
}

/**
 * Generates a cryptographically secure random token
 * Used for sharing budgets between users
 */
export function generateShareToken(): string {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
