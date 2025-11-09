import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Transaction } from '@/types';
import {
  calculateDailyAllowance,
  calculateDailyBudgetsWithCarryOver,
  calculateSpendingVelocity,
  predictFutureSpending,
  calculateSurvivalDays,
} from '@/lib/advancedBudgeting';

interface DailyBudgetTrackerProps {
  transactions: Transaction[];
  monthlyIncome: number;
  fixedExpenses: number;
  currentSavings?: number;
}

export function DailyBudgetTracker({
  transactions,
  monthlyIncome,
  fixedExpenses,
  currentSavings = 0,
}: DailyBudgetTrackerProps) {
  // Calculate budget plan
  const budgetPlan = useMemo(
    () => calculateDailyAllowance(monthlyIncome, fixedExpenses),
    [monthlyIncome, fixedExpenses]
  );

  // Calculate daily budgets with carry-over for last 30 days
  const dailyBudgets = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return calculateDailyBudgetsWithCarryOver(
      transactions,
      startDate,
      endDate,
      budgetPlan.dailyAllowance
    );
  }, [transactions, budgetPlan.dailyAllowance]);

  // Get today's budget
  const todayBudget = dailyBudgets[dailyBudgets.length - 1];

  // Calculate spending velocity
  const velocity = useMemo(
    () => calculateSpendingVelocity(dailyBudgets),
    [dailyBudgets]
  );

  // Predict future spending
  const prediction = useMemo(
    () => predictFutureSpending(transactions, 7),
    [transactions]
  );

  // Calculate survival days
  const survival = useMemo(() => {
    const avgDaily =
      dailyBudgets.reduce((sum, d) => sum + d.spent, 0) / dailyBudgets.length;
    return calculateSurvivalDays(currentSavings, avgDaily);
  }, [currentSavings, dailyBudgets]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' zł';
  };

  return (
    <div className="space-y-4">
      {/* Today's Budget - Main Display */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dzienny Budżet</span>
            <Badge
              variant={
                velocity.status === 'safe'
                  ? 'default'
                  : velocity.status === 'warning'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {velocity.status === 'safe' && '✅ Bezpieczne'}
              {velocity.status === 'warning' && '⚠️ Uwaga'}
              {velocity.status === 'danger' && '🚨 Niebezpieczne'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main allowance display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Możesz dziś wydać:
            </p>
            <p className="text-5xl font-bold text-primary">
              {formatCurrency(
                todayBudget ? todayBudget.allocated + todayBudget.carriedOver : budgetPlan.dailyAllowance
              )}
            </p>
            {todayBudget && todayBudget.carriedOver > 0 && (
              <p className="text-sm text-green-600 mt-2">
                + {formatCurrency(todayBudget.carriedOver)} przeniesione z wczoraj! 🎉
              </p>
            )}
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Bazowy</p>
              <p className="font-semibold">
                {formatCurrency(budgetPlan.dailyAllowance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wydane dziś</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(todayBudget ? todayBudget.spent : 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pozostało</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(todayBudget ? todayBudget.remaining : budgetPlan.dailyAllowance)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {todayBudget && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    todayBudget.spent > todayBudget.allocated + todayBudget.carriedOver
                      ? 'bg-red-500'
                      : todayBudget.spent > todayBudget.allocated * 0.8
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (todayBudget.spent / (todayBudget.allocated + todayBudget.carriedOver)) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {(
                  (todayBudget.spent / (todayBudget.allocated + todayBudget.carriedOver)) *
                  100
                ).toFixed(1)}
                % budżetu wykorzystane
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predictions & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {prediction.trend === 'increasing' && <TrendingUp className="w-4 h-4 text-orange-500" />}
              {prediction.trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-green-500" />}
              {prediction.trend === 'stable' && <CheckCircle className="w-4 h-4 text-blue-500" />}
              Trend Wydatków
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Trend: </span>
                {prediction.trend === 'increasing' && '📈 Rosnący'}
                {prediction.trend === 'decreasing' && '📉 Malejący'}
                {prediction.trend === 'stable' && '➡️ Stabilny'}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Przewidywane dzienny: </span>
                {formatCurrency(prediction.predictedDaily)}
              </p>
              <p className="text-xs text-muted-foreground">
                Pewność prognozy: {prediction.confidence.toFixed(0)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Survival Days */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Fundusz Awaryjny
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Wystarczy na: </span>
                {survival.conservativeEstimate} dni
              </p>
              <p className="text-xs text-muted-foreground">
                Optymistycznie: {survival.optimisticEstimate} dni
              </p>
              <p className="text-xs mt-2">{survival.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Rekomendacje</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {budgetPlan.recommendations.map((rec, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{rec}</span>
              </li>
            ))}
            {velocity.status === 'warning' && (
              <li className="text-sm flex items-start gap-2 text-orange-600">
                <span>⚠️</span>
                <span>Tempo wydatków rośnie - rozważ ograniczenie niepotrzebnych zakupów</span>
              </li>
            )}
            {velocity.status === 'danger' && (
              <li className="text-sm flex items-start gap-2 text-red-600">
                <span>🚨</span>
                <span>UWAGA: Bardzo szybki wzrost wydatków! Natychmiast ogranicz zakupy!</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Last 7 Days History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Ostatnie 7 dni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyBudgets.slice(-7).map((day, index) => {
              const dateStr = day.date.toLocaleDateString('pl-PL', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const total = day.allocated + day.carriedOver;
              const percentage = (day.spent / total) * 100;

              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs w-24 text-muted-foreground">
                    {dateStr}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        percentage > 100
                          ? 'bg-red-500'
                          : percentage > 80
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(100, percentage)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs w-20 text-right">
                    {formatCurrency(day.spent)}
                  </span>
                  {day.remaining > 0 && (
                    <span className="text-xs text-green-600">
                      +{formatCurrency(day.remaining)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
