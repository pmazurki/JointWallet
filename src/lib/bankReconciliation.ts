/**
 * Bank reconciliation and quick transaction management
 * Allows quick expense tracking and automatic balance correction
 */

import {
  Transaction,
  QuickTransaction,
  BankReconciliation,
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
} from '../types';

/**
 * Create a quick transaction (estimated amount)
 */
export function createQuickTransaction(
  type: TransactionType,
  category: ExpenseCategory | IncomeCategory,
  estimatedAmount: number,
  description?: string
): QuickTransaction {
  return {
    id: `quick-${Date.now()}`,
    type,
    category,
    estimatedAmount,
    date: new Date(),
    needsReconciliation: true,
    description,
  };
}

/**
 * Convert quick transaction to regular transaction
 */
export function finalizeQuickTransaction(
  quickTx: QuickTransaction,
  actualAmount: number
): Transaction {
  return {
    id: quickTx.id.replace('quick-', 'tx-'),
    type: quickTx.type,
    category: quickTx.category,
    amount: actualAmount,
    date: quickTx.date,
    isRecurring: false,
    description: quickTx.description,
  };
}

/**
 * Calculate current balance from transactions
 */
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((balance, tx) => {
    if (tx.type === 'income') {
      return balance + tx.amount;
    } else {
      return balance - tx.amount;
    }
  }, 0);
}

/**
 * Reconcile with bank balance
 * Automatically creates adjustment transaction if needed
 */
export function reconcileWithBank(
  transactions: Transaction[],
  reportedBalance: number,
  startingBalance: number = 0
): BankReconciliation {
  const calculatedBalance = startingBalance + calculateBalance(transactions);
  const difference = reportedBalance - calculatedBalance;

  const reconciliation: BankReconciliation = {
    id: `reconcile-${Date.now()}`,
    date: new Date(),
    reportedBalance,
    calculatedBalance,
    difference,
    reconciled: Math.abs(difference) < 0.01, // Tolerance of 1 cent
  };

  return reconciliation;
}

/**
 * Create adjustment transaction to correct balance
 */
export function createAdjustmentTransaction(
  reconciliation: BankReconciliation
): Transaction | null {
  if (reconciliation.reconciled) {
    return null; // No adjustment needed
  }

  const amount = Math.abs(reconciliation.difference);
  const type: TransactionType =
    reconciliation.difference > 0 ? 'income' : 'expense';
  const category =
    type === 'income' ? ('Inne' as IncomeCategory) : ('Inne' as ExpenseCategory);

  return {
    id: `adjustment-${Date.now()}`,
    type,
    category,
    amount,
    date: reconciliation.date,
    isRecurring: false,
    description: `Korekta salda: różnica ${reconciliation.difference.toFixed(2)} zł`,
  };
}

/**
 * Suggest category for uncategorized transactions
 * Uses simple machine learning (pattern matching)
 */
export function suggestCategory(
  description: string
): ExpenseCategory | IncomeCategory {
  const desc = description.toLowerCase();

  // Income patterns
  if (
    desc.includes('wynagrodzenie') ||
    desc.includes('pensja') ||
    desc.includes('salary')
  ) {
    return 'Wynagrodzenie';
  }
  if (desc.includes('freelance') || desc.includes('zlecenie')) {
    return 'Freelance';
  }
  if (desc.includes('prezent') || desc.includes('gift')) {
    return 'Prezent';
  }

  // Expense patterns
  if (
    desc.includes('jedzenie') ||
    desc.includes('żywność') ||
    desc.includes('restaurant') ||
    desc.includes('sklep') ||
    desc.includes('market')
  ) {
    return 'Jedzenie';
  }
  if (
    desc.includes('transport') ||
    desc.includes('benzyna') ||
    desc.includes('uber') ||
    desc.includes('taxi') ||
    desc.includes('bilet')
  ) {
    return 'Transport';
  }
  if (
    desc.includes('czynsz') ||
    desc.includes('mieszkanie') ||
    desc.includes('rent') ||
    desc.includes('prąd') ||
    desc.includes('woda')
  ) {
    return 'Mieszkanie';
  }
  if (
    desc.includes('kino') ||
    desc.includes('rozrywka') ||
    desc.includes('netflix') ||
    desc.includes('spotify')
  ) {
    return 'Rozrywka';
  }

  // Default to "Inne"
  return 'Inne';
}

/**
 * Auto-categorize multiple transactions
 */
export function autoCategorizeTransactions(
  transactions: { description: string; amount: number }[]
): Array<{
  description: string;
  amount: number;
  suggestedCategory: ExpenseCategory | IncomeCategory;
  confidence: number;
}> {
  return transactions.map((tx) => {
    const suggestedCategory = suggestCategory(tx.description);

    // Calculate confidence based on keyword matching
    const desc = tx.description.toLowerCase();
    let confidence = 50; // Base confidence

    // Boost confidence if strong keywords found
    const strongKeywords = [
      'wynagrodzenie',
      'pensja',
      'czynsz',
      'jedzenie',
      'transport',
    ];
    if (strongKeywords.some((kw) => desc.includes(kw))) {
      confidence = 90;
    }

    return {
      description: tx.description,
      amount: tx.amount,
      suggestedCategory,
      confidence,
    };
  });
}

/**
 * Import transactions from CSV or bank statement
 */
export function parseCSVTransactions(csv: string): Array<{
  date: Date;
  description: string;
  amount: number;
}> {
  const lines = csv.split('\n').filter((line) => line.trim());
  const transactions: Array<{
    date: Date;
    description: string;
    amount: number;
  }> = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 3) {
      try {
        const date = new Date(parts[0].trim());
        const description = parts[1].trim();
        const amount = parseFloat(parts[2].trim());

        if (!isNaN(date.getTime()) && !isNaN(amount)) {
          transactions.push({ date, description, amount });
        }
      } catch (e) {
        console.error('Error parsing line:', lines[i], e);
      }
    }
  }

  return transactions;
}

/**
 * Detect duplicate transactions
 */
export function findDuplicates(
  transactions: Transaction[]
): Array<{ transaction: Transaction; duplicates: Transaction[] }> {
  const duplicateGroups: Array<{
    transaction: Transaction;
    duplicates: Transaction[];
  }> = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx1 = transactions[i];
    const duplicates: Transaction[] = [];

    for (let j = i + 1; j < transactions.length; j++) {
      const tx2 = transactions[j];

      // Check if transactions are similar
      const sameAmount = Math.abs(tx1.amount - tx2.amount) < 0.01;
      const sameDate =
        Math.abs(tx1.date.getTime() - tx2.date.getTime()) < 24 * 60 * 60 * 1000; // Within 24h
      const sameCategory = tx1.category === tx2.category;
      const sameType = tx1.type === tx2.type;

      if (sameAmount && sameDate && sameCategory && sameType) {
        duplicates.push(tx2);
      }
    }

    if (duplicates.length > 0) {
      duplicateGroups.push({ transaction: tx1, duplicates });
    }
  }

  return duplicateGroups;
}

/**
 * Calculate spending insights
 */
export function calculateSpendingInsights(transactions: Transaction[]): {
  averageDailySpending: number;
  largestExpense: Transaction | null;
  mostFrequentCategory: ExpenseCategory | null;
  totalSaved: number;
  spendingByCategory: { category: string; amount: number; percentage: number }[];
} {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const income = transactions.filter((t) => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Average daily spending
  const oldestDate =
    expenses.length > 0
      ? new Date(Math.min(...expenses.map((t) => t.date.getTime())))
      : new Date();
  const newestDate =
    expenses.length > 0
      ? new Date(Math.max(...expenses.map((t) => t.date.getTime())))
      : new Date();
  const daysDiff = Math.max(
    1,
    (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const averageDailySpending = totalExpenses / daysDiff;

  // Largest expense
  const largestExpense =
    expenses.length > 0
      ? expenses.reduce((max, t) => (t.amount > max.amount ? t : max))
      : null;

  // Most frequent category
  const categoryCount = new Map<ExpenseCategory, number>();
  expenses.forEach((t) => {
    const cat = t.category as ExpenseCategory;
    categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
  });
  let mostFrequentCategory: ExpenseCategory | null = null;
  let maxCount = 0;
  categoryCount.forEach((count, cat) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentCategory = cat;
    }
  });

  // Total saved
  const totalSaved = totalIncome - totalExpenses;

  // Spending by category
  const categorySpending = new Map<string, number>();
  expenses.forEach((t) => {
    categorySpending.set(
      t.category,
      (categorySpending.get(t.category) || 0) + t.amount
    );
  });
  const spendingByCategory = Array.from(categorySpending.entries()).map(
    ([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalExpenses) * 100,
    })
  );
  spendingByCategory.sort((a, b) => b.amount - a.amount);

  return {
    averageDailySpending,
    largestExpense,
    mostFrequentCategory,
    totalSaved,
    spendingByCategory,
  };
}
