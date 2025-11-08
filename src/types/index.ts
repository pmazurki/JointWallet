export type TransactionType = 'expense' | 'income';

export type ExpenseCategory = 'Jedzenie' | 'Transport' | 'Rozrywka' | 'Mieszkanie' | 'Inne';
export type IncomeCategory = 'Wynagrodzenie' | 'Freelance' | 'Inwestycje' | 'Prezent' | 'Inne';

export type RecurrencePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Participant {
  id: string;
  name: string;
  percentage: number; // 0-100
  color: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  date: Date;
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod;
  description?: string;
  // Współdzielone wydatki
  isShared?: boolean;
  sharedExpenseId?: string;
  myShare?: number; // Moja część do zapłaty
}

export interface SharedExpense {
  id: string;
  hash: string;
  name: string;
  totalAmount: number;
  category: ExpenseCategory;
  date: Date;
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod;
  participants: Participant[];
  createdBy: string;
  description?: string;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface FinancialHealth {
  score: number;
  status: 'Krytyczny' | 'Słaby' | 'Dobry' | 'Bardzo dobry' | 'Doskonały';
  variant: 'destructive' | 'secondary' | 'default' | 'outline';
}
