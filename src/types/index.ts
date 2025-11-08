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

// Multi-budget system types
export type BudgetType = 'personal' | 'shared';

export interface BudgetShareInfo {
  shareToken: string;
  sharedWith: string[]; // List of user identifiers (could be emails or usernames)
  createdAt: Date;
  lastSyncedAt?: Date;
}

export interface Budget {
  id: string;
  name: string;
  type: BudgetType;
  transactions: Transaction[];
  shareInfo?: BudgetShareInfo;
  createdAt: Date;
  color?: string; // For UI differentiation
}

export interface User {
  id: string;
  name: string;
  createdAt: Date;
}

export interface AppData {
  version: string;
  user: User;
  budgets: Budget[];
  activeBudgetId: string;
}

// Advanced budgeting rules (50/30/20 method)
export interface BudgetAllocation {
  needs: number; // 50% - essential expenses (Jedzenie, Mieszkanie, Transport)
  wants: number; // 30% - discretionary spending (Rozrywka, Inne)
  savings: number; // 20% - savings and investments
}

export interface BudgetRule {
  type: '50/30/20' | 'envelope' | 'zero-based';
  allocation: BudgetAllocation;
  warnings: string[];
}

// Envelope budgeting
export interface Envelope {
  category: ExpenseCategory;
  allocated: number;
  spent: number;
  remaining: number;
}
