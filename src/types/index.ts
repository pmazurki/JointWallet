export type TransactionType = 'expense' | 'income';

export type ExpenseCategory = 'Jedzenie' | 'Transport' | 'Rozrywka' | 'Mieszkanie' | 'Inne';
export type IncomeCategory = 'Wynagrodzenie' | 'Freelance' | 'Inwestycje' | 'Prezent' | 'Inne';

export type RecurrencePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  date: Date;
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod;
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
