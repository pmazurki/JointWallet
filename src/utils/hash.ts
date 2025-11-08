/**
 * Generuje hash SHA-256 dla transakcji
 * @param data - dane do hashowania
 * @returns Promise z hash'em w formacie hex
 */
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Tworzy hash dla transakcji na podstawie jej danych
 */
export async function createTransactionHash(
  type: string,
  category: string,
  amount: number,
  date: Date,
  isRecurring: boolean,
  recurrencePeriod?: string
): Promise<string> {
  const data = `${type}-${category}-${amount}-${date.toISOString()}-${isRecurring}-${recurrencePeriod || 'none'}`;
  return generateHash(data);
}

/**
 * Tworzy hash dla współdzielonego wydatku
 */
export async function createSharedExpenseHash(
  name: string,
  totalAmount: number,
  category: string,
  date: Date,
  participantIds: string[]
): Promise<string> {
  const data = `${name}-${totalAmount}-${category}-${date.toISOString()}-${participantIds.sort().join(',')}`;
  return generateHash(data);
}

/**
 * Weryfikuje czy hash pasuje do danych transakcji
 */
export async function verifyTransactionHash(
  hash: string,
  type: string,
  category: string,
  amount: number,
  date: Date,
  isRecurring: boolean,
  recurrencePeriod?: string
): Promise<boolean> {
  const calculatedHash = await createTransactionHash(type, category, amount, date, isRecurring, recurrencePeriod);
  return hash === calculatedHash;
}
