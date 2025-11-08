/**
 * Secure storage wrapper with encryption
 * All data stored in localStorage is encrypted with user's PIN
 */

import { encryptData, decryptData } from './encryption';

const STORAGE_KEY = 'budgetData';
const PIN_HASH_KEY = 'pinHash';

/**
 * Stores encrypted data in localStorage
 */
export async function saveEncryptedData(
  data: any,
  pin: string
): Promise<void> {
  try {
    const jsonData = JSON.stringify(data);
    const encrypted = await encryptData(jsonData, pin);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save encrypted data:', error);
    throw new Error('Nie udało się zapisać danych');
  }
}

/**
 * Loads and decrypts data from localStorage
 */
export async function loadEncryptedData<T>(pin: string): Promise<T | null> {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) {
      return null;
    }

    const decrypted = await decryptData(encrypted, pin);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to load encrypted data:', error);
    throw error;
  }
}

/**
 * Checks if encrypted data exists in storage
 */
export function hasEncryptedData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Clears all encrypted data from storage
 */
export function clearEncryptedData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PIN_HASH_KEY);
}

/**
 * Creates a hash of the PIN for verification without storing the actual PIN
 */
async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sets up the initial PIN (first time setup)
 */
export async function setupPIN(pin: string): Promise<void> {
  try {
    const hash = await hashPIN(pin);
    localStorage.setItem(PIN_HASH_KEY, hash);
  } catch (error) {
    console.error('Failed to setup PIN:', error);
    throw new Error('Nie udało się ustawić PIN-u');
  }
}

/**
 * Verifies if the provided PIN matches the stored hash
 */
export async function verifyPIN(pin: string): Promise<boolean> {
  try {
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) {
      return false;
    }

    const hash = await hashPIN(pin);
    return hash === storedHash;
  } catch (error) {
    console.error('Failed to verify PIN:', error);
    return false;
  }
}

/**
 * Checks if PIN has been set up
 */
export function isPINSetup(): boolean {
  return localStorage.getItem(PIN_HASH_KEY) !== null;
}
