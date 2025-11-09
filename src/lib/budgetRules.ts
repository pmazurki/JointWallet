/**
 * Advanced budgeting mathematical models
 * Implements popular budgeting strategies: 50/30/20 rule, envelope budgeting, zero-based budgeting
 */

import {
  Transaction,
  ExpenseCategory,
  BudgetRule,
  Envelope,
} from '../types';

/**
 * Categorizes expense into needs, wants, or savings based on category
 */
function categorizeExpense(
  category: ExpenseCategory
): 'needs' | 'wants' | 'savings' {
  const needsCategories: ExpenseCategory[] = ['Jedzenie', 'Mieszkanie', 'Transport'];
  const wantsCategories: ExpenseCategory[] = ['Rozrywka', 'Inne'];

  if (needsCategories.includes(category)) {
    return 'needs';
  } else if (wantsCategories.includes(category)) {
    return 'wants';
  }
  return 'wants'; // Default to wants
}

/**
 * Implements the 50/30/20 budgeting rule
 * - 50% of income should go to needs (essential expenses)
 * - 30% to wants (discretionary spending)
 * - 20% to savings and debt repayment
 */
export function calculate503020Rule(
  _transactions: Transaction[],
  normalizedTransactions: Transaction[]
): BudgetRule {
  // Calculate total income
  const totalIncome = normalizedTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate actual spending by category
  let actualNeeds = 0;
  let actualWants = 0;

  normalizedTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const category = categorizeExpense(t.category as ExpenseCategory);
      if (category === 'needs') {
        actualNeeds += t.amount;
      } else {
        actualWants += t.amount;
      }
    });

  const totalExpenses = actualNeeds + actualWants;
  const actualSavings = totalIncome - totalExpenses;

  // Calculate ideal allocation (50/30/20)
  const idealNeeds = totalIncome * 0.5;
  const idealWants = totalIncome * 0.3;
  const idealSavings = totalIncome * 0.2;

  // Generate warnings
  const warnings: string[] = [];

  if (actualNeeds > idealNeeds) {
    const overPercent = ((actualNeeds / totalIncome) * 100).toFixed(0);
    warnings.push(
      `Wydatki na potrzeby (${overPercent}%) przekraczają zalecane 50%`
    );
  }

  if (actualWants > idealWants) {
    const overPercent = ((actualWants / totalIncome) * 100).toFixed(0);
    warnings.push(
      `Wydatki na przyjemności (${overPercent}%) przekraczają zalecane 30%`
    );
  }

  if (actualSavings < idealSavings) {
    const savingsPercent = ((actualSavings / totalIncome) * 100).toFixed(0);
    warnings.push(
      `Oszczędności (${savingsPercent}%) są poniżej zalecanych 20%`
    );
  }

  if (actualSavings < 0) {
    warnings.push('⚠️ Wydajesz więcej niż zarabiasz! Pilnie zmniejsz wydatki.');
  }

  return {
    type: '50/30/20',
    allocation: {
      needs: actualNeeds,
      wants: actualWants,
      savings: actualSavings,
    },
    warnings,
  };
}

/**
 * Implements envelope budgeting system
 * Allocates fixed amounts to each spending category
 */
export function calculateEnvelopeBudget(
  _transactions: Transaction[],
  normalizedTransactions: Transaction[],
  allocations: { [key in ExpenseCategory]?: number }
): Envelope[] {
  const envelopes: Envelope[] = [];

  // Get all expense categories
  const categories: ExpenseCategory[] = [
    'Jedzenie',
    'Transport',
    'Rozrywka',
    'Mieszkanie',
    'Inne',
  ];

  categories.forEach((category) => {
    const allocated = allocations[category] || 0;
    const spent = normalizedTransactions
      .filter((t) => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);

    envelopes.push({
      category,
      allocated,
      spent,
      remaining: allocated - spent,
    });
  });

  return envelopes;
}

/**
 * Calculates ideal monthly budget allocation based on income
 * Uses conservative financial planning principles
 */
export function calculateIdealBudget(monthlyIncome: number): {
  [key: string]: number;
} {
  return {
    // Needs (50%)
    Mieszkanie: monthlyIncome * 0.3, // 30% for housing
    Jedzenie: monthlyIncome * 0.15, // 15% for food
    Transport: monthlyIncome * 0.05, // 5% for transport

    // Wants (30%)
    Rozrywka: monthlyIncome * 0.2, // 20% for entertainment/discretionary
    Inne: monthlyIncome * 0.1, // 10% for other wants

    // Savings (20%)
    Oszczędności: monthlyIncome * 0.2, // 20% for savings
  };
}

/**
 * Analyzes spending trends and provides actionable insights
 */
export function analyzeBudgetTrends(
  transactions: Transaction[]
): {
  topCategory: ExpenseCategory | null;
  averageDaily: number;
  projectedMonthly: number;
  insights: string[];
} {
  const expenses = transactions.filter((t) => t.type === 'expense');

  if (expenses.length === 0) {
    return {
      topCategory: null,
      averageDaily: 0,
      projectedMonthly: 0,
      insights: ['Brak transakcji do analizy'],
    };
  }

  // Find category with most spending
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach((t) => {
    const cat = t.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  });

  const topCategory = Object.keys(categoryTotals).reduce((a, b) =>
    categoryTotals[a] > categoryTotals[b] ? a : b
  ) as ExpenseCategory;

  // Calculate averages
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const oldestDate = new Date(
    Math.min(...expenses.map((t) => t.date.getTime()))
  );
  const newestDate = new Date(
    Math.max(...expenses.map((t) => t.date.getTime()))
  );
  const daysDiff =
    Math.max(
      1,
      (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

  const averageDaily = totalExpenses / daysDiff;
  const projectedMonthly = averageDaily * 30;

  // Generate insights
  const insights: string[] = [];
  insights.push(
    `Najwięcej wydajesz na: ${topCategory} (${categoryTotals[topCategory].toFixed(2)} zł)`
  );

  if (averageDaily > 100) {
    insights.push(
      `Średnio wydajesz ${averageDaily.toFixed(2)} zł dziennie - rozważ zmniejszenie wydatków`
    );
  }

  const recurringCount = expenses.filter((t) => t.isRecurring).length;
  if (recurringCount > 0) {
    insights.push(
      `Masz ${recurringCount} cyklicznych wydatków - sprawdź, czy wszystkie są potrzebne`
    );
  }

  return {
    topCategory,
    averageDaily,
    projectedMonthly,
    insights,
  };
}

/**
 * Calculates emergency fund target (3-6 months of expenses)
 */
export function calculateEmergencyFundTarget(
  monthlyExpenses: number
): {
  minimum: number;
  recommended: number;
  optimal: number;
} {
  return {
    minimum: monthlyExpenses * 3, // 3 months
    recommended: monthlyExpenses * 6, // 6 months
    optimal: monthlyExpenses * 12, // 12 months for extra security
  };
}
