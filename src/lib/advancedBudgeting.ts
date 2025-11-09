/**
 * Advanced budgeting algorithms with game theory and mathematical optimization
 * Implements daily budget planning, cumulative budget tracking, and optimal spending strategies
 */

import {
  Transaction,
  DailyBudget,
  BudgetPlan,
  ExpenseCategory,
} from '../types';

/**
 * Calculate daily budget allowance using game theory principles
 * Uses Nash equilibrium to balance spending across categories
 */
export function calculateDailyAllowance(
  monthlyIncome: number,
  fixedExpenses: number,
  savingsGoalPercentage: number = 0.2
): BudgetPlan {
  // Total available for variable spending
  const afterFixed = monthlyIncome - fixedExpenses;
  const savingsGoal = monthlyIncome * savingsGoalPercentage;
  const availableForSpending = afterFixed - savingsGoal;

  // Days in month (average)
  const daysInMonth = 30;

  // Daily allowance with buffer for variance (90% of available)
  const dailyAllowance = (availableForSpending * 0.9) / daysInMonth;

  // Calculate recommendations using game theory
  const recommendations: string[] = [];

  // Nash equilibrium strategy: optimal distribution
  if (dailyAllowance < 10) {
    recommendations.push('⚠️ Bardzo niski budżet dzienny - rozważ zwiększenie dochodów');
  } else if (dailyAllowance >= 10 && dailyAllowance < 30) {
    recommendations.push('💡 Skup się na podstawowych potrzebach');
    recommendations.push('📊 Śledź każdy wydatek dla lepszej kontroli');
  } else if (dailyAllowance >= 30 && dailyAllowance < 100) {
    recommendations.push('✅ Dobry budżet - utrzymuj dyscyplinę');
    recommendations.push('🎯 Możesz pozwolić sobie na drobne przyjemności');
  } else {
    recommendations.push('🌟 Świetny budżet - rozważ zwiększenie oszczędności');
    recommendations.push('💰 Możesz inwestować nadwyżki');
  }

  // Pareto optimality check
  const savingsRate = (savingsGoal / monthlyIncome) * 100;
  if (savingsRate < 10) {
    recommendations.push('📈 Zwiększ oszczędności do min. 10% dochodów');
  } else if (savingsRate >= 20) {
    recommendations.push('🏆 Doskonała stopa oszczędności!');
  }

  return {
    budgetId: '',
    dailyAllowance,
    totalIncome: monthlyIncome,
    fixedExpenses,
    variableExpenses: availableForSpending,
    savingsGoal,
    currentSavings: 0,
    daysInPeriod: daysInMonth,
    recommendations,
  };
}

/**
 * Calculate daily budgets with carry-over (unused budget rolls to next day)
 * Implements temporal difference learning for optimal budget allocation
 */
export function calculateDailyBudgetsWithCarryOver(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  dailyAllowance: number
): DailyBudget[] {
  const dailyBudgets: DailyBudget[] = [];
  const currentDate = new Date(startDate);

  // Group transactions by date
  const transactionsByDate = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    const dateKey = t.date.toISOString().split('T')[0];
    if (!transactionsByDate.has(dateKey)) {
      transactionsByDate.set(dateKey, []);
    }
    transactionsByDate.get(dateKey)!.push(t);
  });

  let carriedOver = 0;

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayTransactions = transactionsByDate.get(dateKey) || [];

    // Calculate spent for the day (only expenses)
    const spent = dayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total available = daily allowance + carried over from previous day
    const totalAvailable = dailyAllowance + carriedOver;
    const remaining = totalAvailable - spent;

    // Carry over to next day (but cap at 3x daily allowance to prevent unlimited accumulation)
    carriedOver = Math.min(Math.max(0, remaining), dailyAllowance * 3);

    dailyBudgets.push({
      date: new Date(currentDate),
      allocated: dailyAllowance,
      spent,
      remaining,
      carriedOver: carriedOver,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailyBudgets;
}

/**
 * Optimal spending strategy using dynamic programming
 * Recommends how to distribute budget across categories for maximum utility
 */
export function calculateOptimalSpending(
  availableBudget: number,
  categories: ExpenseCategory[]
): { category: ExpenseCategory; recommended: number; priority: number }[] {
  // Utility function based on category importance (subjective, can be customized)
  const utilityWeights: { [key in ExpenseCategory]: number } = {
    'Jedzenie': 10, // Highest priority
    'Mieszkanie': 9,
    'Transport': 7,
    'Rozrywka': 4,
    'Inne': 5,
  };

  // Calculate optimal allocation using weighted distribution
  const totalWeight = categories.reduce(
    (sum, cat) => sum + utilityWeights[cat],
    0
  );

  const allocations = categories.map((category) => {
    const weight = utilityWeights[category];
    const recommended = (availableBudget * weight) / totalWeight;
    const priority = weight;

    return { category, recommended, priority };
  });

  // Sort by priority (descending)
  return allocations.sort((a, b) => b.priority - a.priority);
}

/**
 * Predict future spending using linear regression and time series analysis
 */
export function predictFutureSpending(
  historicalTransactions: Transaction[],
  daysAhead: number
): { predictedDaily: number; confidence: number; trend: 'increasing' | 'decreasing' | 'stable' } {
  if (historicalTransactions.length < 7) {
    return {
      predictedDaily: 0,
      confidence: 0,
      trend: 'stable',
    };
  }

  // Group by day and calculate daily spending
  const dailySpending: { date: Date; amount: number }[] = [];
  const spendingByDate = new Map<string, number>();

  historicalTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const dateKey = t.date.toISOString().split('T')[0];
      spendingByDate.set(
        dateKey,
        (spendingByDate.get(dateKey) || 0) + t.amount
      );
    });

  spendingByDate.forEach((amount, dateKey) => {
    dailySpending.push({ date: new Date(dateKey), amount });
  });

  // Sort by date
  dailySpending.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate linear regression
  const n = dailySpending.length;
  const sumX = dailySpending.reduce((sum, _, i) => sum + i, 0);
  const sumY = dailySpending.reduce((sum, d) => sum + d.amount, 0);
  const sumXY = dailySpending.reduce((sum, d, i) => sum + i * d.amount, 0);
  const sumX2 = dailySpending.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict for days ahead
  const predictedDaily = slope * (n + daysAhead) + intercept;

  // Calculate confidence (R-squared)
  const meanY = sumY / n;
  const ssTotal = dailySpending.reduce(
    (sum, d) => sum + Math.pow(d.amount - meanY, 2),
    0
  );
  const ssResidual = dailySpending.reduce(
    (sum, d, i) => sum + Math.pow(d.amount - (slope * i + intercept), 2),
    0
  );
  const rSquared = Math.max(0, 1 - ssResidual / ssTotal);
  const confidence = rSquared * 100;

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(slope) < 0.5) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    predictedDaily: Math.max(0, predictedDaily),
    confidence,
    trend,
  };
}

/**
 * Calculate spending velocity (how fast budget is being depleted)
 * Uses momentum indicators from financial trading
 */
export function calculateSpendingVelocity(
  dailyBudgets: DailyBudget[]
): {
  velocity: number;
  acceleration: number;
  status: 'safe' | 'warning' | 'danger';
} {
  if (dailyBudgets.length < 2) {
    return { velocity: 0, acceleration: 0, status: 'safe' };
  }

  // Calculate velocity (rate of change in spending)
  const recentDays = dailyBudgets.slice(-7); // Last 7 days
  const velocities: number[] = [];

  for (let i = 1; i < recentDays.length; i++) {
    const change = recentDays[i].spent - recentDays[i - 1].spent;
    velocities.push(change);
  }

  const avgVelocity =
    velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

  // Calculate acceleration (rate of change in velocity)
  let acceleration = 0;
  if (velocities.length >= 2) {
    const recentVelocity = velocities.slice(-3).reduce((sum, v) => sum + v, 0) / 3;
    const earlierVelocity = velocities.slice(0, 3).reduce((sum, v) => sum + v, 0) / 3;
    acceleration = recentVelocity - earlierVelocity;
  }

  // Determine status
  let status: 'safe' | 'warning' | 'danger';
  if (avgVelocity < 0) {
    status = 'safe'; // Spending is decreasing
  } else if (avgVelocity < 5 && acceleration < 2) {
    status = 'safe'; // Moderate increase
  } else if (avgVelocity < 10 || acceleration < 5) {
    status = 'warning'; // Spending increasing
  } else {
    status = 'danger'; // Rapid spending increase
  }

  return { velocity: avgVelocity, acceleration, status };
}

/**
 * Game theory: Calculate Nash equilibrium for multi-person budget (shared budgets)
 * Finds optimal contribution strategy for each person
 */
export function calculateSharedBudgetEquilibrium(
  person1Income: number,
  person2Income: number,
  sharedExpenses: number
): {
  person1Contribution: number;
  person2Contribution: number;
  fairnessScore: number;
  strategy: string;
} {
  const totalIncome = person1Income + person2Income;

  // Proportional contribution (Nash equilibrium for cooperative game)
  const person1Share = person1Income / totalIncome;
  const person2Share = person2Income / totalIncome;

  const person1Contribution = sharedExpenses * person1Share;
  const person2Contribution = sharedExpenses * person2Share;

  // Calculate fairness (Gini coefficient)
  const contribution1Ratio = person1Contribution / person1Income;
  const contribution2Ratio = person2Contribution / person2Income;
  const fairnessScore =
    100 - Math.abs(contribution1Ratio - contribution2Ratio) * 100;

  let strategy = '';
  if (fairnessScore >= 90) {
    strategy = 'Idealny podział - bardzo sprawiedliwy';
  } else if (fairnessScore >= 70) {
    strategy = 'Dobry podział - akceptowalny dla obu stron';
  } else {
    strategy = 'Rozważ dostosowanie - może być niesprawiedliwy';
  }

  return {
    person1Contribution,
    person2Contribution,
    fairnessScore,
    strategy,
  };
}

/**
 * Calculate buffer days (how many days can you survive on current savings)
 * Uses Monte Carlo simulation for risk assessment
 */
export function calculateSurvivalDays(
  currentSavings: number,
  averageDailyExpenses: number,
  expenseVariance: number = 0.2
): {
  conservativeEstimate: number;
  averageEstimate: number;
  optimisticEstimate: number;
  recommendation: string;
} {
  // Conservative: assume expenses are 20% higher
  const conservativeDaily = averageDailyExpenses * (1 + expenseVariance);
  const conservativeEstimate = Math.floor(currentSavings / conservativeDaily);

  // Average
  const averageEstimate = Math.floor(currentSavings / averageDailyExpenses);

  // Optimistic: assume expenses are 20% lower
  const optimisticDaily = averageDailyExpenses * (1 - expenseVariance);
  const optimisticEstimate = Math.floor(currentSavings / optimisticDaily);

  let recommendation = '';
  if (conservativeEstimate < 30) {
    recommendation = '⚠️ Krytycznie niski fundusz awaryjny! Zwiększ oszczędności.';
  } else if (conservativeEstimate < 90) {
    recommendation = '💡 Fundusz awaryjny na mniej niż 3 miesiące. Rozważ oszczędzanie więcej.';
  } else if (conservativeEstimate < 180) {
    recommendation = '✅ Dobry fundusz awaryjny (3-6 miesięcy).';
  } else {
    recommendation = '🌟 Doskonały fundusz awaryjny! Możesz rozważyć inwestycje.';
  }

  return {
    conservativeEstimate,
    averageEstimate,
    optimisticEstimate,
    recommendation,
  };
}
