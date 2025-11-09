export type TransactionType = 'expense' | 'income';

export type ExpenseCategory = 'food' | 'transport' | 'entertainment' | 'housing' | 'other';
export type IncomeCategory = 'salary' | 'freelance' | 'investments' | 'gift' | 'other';

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
  status: 'critical' | 'poor' | 'good' | 'veryGood' | 'excellent';
  variant: 'destructive' | 'secondary' | 'default' | 'outline';
}
