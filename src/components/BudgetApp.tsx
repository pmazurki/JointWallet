import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import {
  Transaction,
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  RecurrencePeriod,
  BudgetSummary,
  FinancialHealth,
} from '@/types';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Jedzenie', 'Transport', 'Rozrywka', 'Mieszkanie', 'Inne'];
const INCOME_CATEGORIES: IncomeCategory[] = ['Wynagrodzenie', 'Freelance', 'Inwestycje', 'Prezent', 'Inne'];

const BudgetApp = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | IncomeCategory>('Jedzenie');
  const [amount, setAmount] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<RecurrencePeriod>('monthly');
  const [summaryPeriod, setSummaryPeriod] = useState<RecurrencePeriod>('monthly');

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('budgetTransactions');
    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions);
        // Convert date strings back to Date objects
        const withDates = parsed.map((t: any) => ({
          ...t,
          date: new Date(t.date),
        }));
        setTransactions(withDates);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  // Update selected category when transaction type changes
  useEffect(() => {
    if (transactionType === 'expense') {
      setSelectedCategory('Jedzenie');
    } else {
      setSelectedCategory('Wynagrodzenie');
    }
  }, [transactionType]);

  const addTransaction = () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Proszę wprowadzić prawidłową kwotę');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: transactionType,
      category: selectedCategory,
      amount: numAmount,
      date: new Date(),
      isRecurring,
      recurrencePeriod: isRecurring ? recurrencePeriod : undefined,
    };

    setTransactions([newTransaction, ...transactions]);
    setAmount('');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Calculate days in period
  const getDaysInPeriod = (period: RecurrencePeriod): number => {
    switch (period) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365;
    }
  };

  // Calculate budget summary for a given period
  const calculateBudgetSummary = (period: RecurrencePeriod): BudgetSummary => {
    const daysInPeriod = getDaysInPeriod(period);

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
      const transactionAmount = transaction.amount;
      let normalizedAmount = 0;

      if (transaction.isRecurring && transaction.recurrencePeriod) {
        const transactionDays = getDaysInPeriod(transaction.recurrencePeriod);
        // Calculate how many times this recurring transaction occurs in the period
        const occurrences = daysInPeriod / transactionDays;
        normalizedAmount = transactionAmount * occurrences;
      } else {
        // One-time transaction: include it as-is
        normalizedAmount = transactionAmount;
      }

      if (transaction.type === 'income') {
        totalIncome += normalizedAmount;
      } else {
        totalExpenses += normalizedAmount;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    };
  };

  const budgetSummary = useMemo(
    () => calculateBudgetSummary(summaryPeriod),
    [transactions, summaryPeriod]
  );

  // Calculate financial health score
  const calculateFinancialHealth = (): FinancialHealth => {
    const { totalIncome, totalExpenses, balance } = budgetSummary;

    if (totalIncome === 0) {
      return { score: 0, status: 'Krytyczny', variant: 'destructive' };
    }

    const savingsRate = (balance / totalIncome) * 100;
    const expenseRatio = (totalExpenses / totalIncome) * 100;

    // Calculate score based on multiple factors
    let score = 0;

    // Savings rate (0-50 points)
    if (savingsRate >= 30) score += 50;
    else if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 10) score += 30;
    else if (savingsRate >= 5) score += 20;
    else if (savingsRate > 0) score += 10;

    // Expense ratio (0-30 points)
    if (expenseRatio <= 50) score += 30;
    else if (expenseRatio <= 70) score += 20;
    else if (expenseRatio <= 90) score += 10;

    // Balance positive (0-20 points)
    if (balance > 0) score += 20;
    else if (balance === 0) score += 10;

    score = Math.min(100, score);

    let status: FinancialHealth['status'];
    let variant: FinancialHealth['variant'];

    if (score >= 80) {
      status = 'Doskonały';
      variant = 'default';
    } else if (score >= 60) {
      status = 'Bardzo dobry';
      variant = 'default';
    } else if (score >= 40) {
      status = 'Dobry';
      variant = 'secondary';
    } else if (score >= 20) {
      status = 'Słaby';
      variant = 'outline';
    } else {
      status = 'Krytyczny';
      variant = 'destructive';
    }

    return { score, status, variant };
  };

  const financialHealth = useMemo(
    () => calculateFinancialHealth(),
    [budgetSummary]
  );

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' zł';
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPeriodLabel = (period: RecurrencePeriod): string => {
    const labels = {
      daily: 'Dziennie',
      weekly: 'Tygodniowo',
      monthly: 'Miesięcznie',
      yearly: 'Rocznie',
    };
    return labels[period];
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-3xl font-bold text-center text-primary">Budżet Osobisty</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Type Tabs */}
          <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as TransactionType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Wydatki</TabsTrigger>
              <TabsTrigger value="income">Przychody</TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="mt-4">
              <div className="flex flex-wrap justify-start gap-2">
                {EXPENSE_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className={`p-2 flex flex-col items-center justify-center ${
                      selectedCategory === category && transactionType === 'expense'
                        ? 'bg-red-500 bg-opacity-20 border-red-500'
                        : ''
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="text-xs">{category}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="income" className="mt-4">
              <div className="flex flex-wrap justify-start gap-2">
                {INCOME_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className={`p-2 flex flex-col items-center justify-center ${
                      selectedCategory === category && transactionType === 'income'
                        ? 'bg-green-500 bg-opacity-20 border-green-500'
                        : ''
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="text-xs">{category}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Transaction Input */}
          <div className="flex flex-wrap gap-2">
            <Input
              type="number"
              placeholder="Kwota"
              className="flex-1 min-w-[120px]"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTransaction();
                }
              }}
            />

            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={recurrencePeriod}
              onChange={(e) => setRecurrencePeriod(e.target.value as RecurrencePeriod)}
            >
              <option value="daily">Dziennie</option>
              <option value="weekly">Tygodniowo</option>
              <option value="monthly">Miesięcznie</option>
              <option value="yearly">Rocznie</option>
            </select>

            <div className="flex items-center space-x-2 px-3">
              <input
                type="checkbox"
                id="recurring"
                className="h-4 w-4 rounded border-input"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <label htmlFor="recurring" className="text-sm font-medium">
                Cykliczne
              </label>
            </div>

            <Button onClick={addTransaction} className="min-w-[80px]">
              Dodaj
            </Button>
          </div>

          {/* Transactions List */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Twoje transakcje:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Brak transakcji. Dodaj swoją pierwszą transakcję powyżej!
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      transaction.type === 'income'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{transaction.category}</span>
                        {transaction.isRecurring && (
                          <Badge variant="outline" className="text-xs">
                            {getPeriodLabel(transaction.recurrencePeriod!)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold text-lg ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTransaction(transaction.id)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Budget Summary */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Podsumowanie budżetu:</h3>
            <Tabs value={summaryPeriod} onValueChange={(v) => setSummaryPeriod(v as RecurrencePeriod)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="daily">Dziennie</TabsTrigger>
                <TabsTrigger value="weekly">Tygodniowo</TabsTrigger>
                <TabsTrigger value="monthly">Miesięcznie</TabsTrigger>
                <TabsTrigger value="yearly">Rocznie</TabsTrigger>
              </TabsList>

              {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrencePeriod[]).map((period) => (
                <TabsContent key={period} value={period}>
                  <div className="space-y-3 mt-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="font-medium">Całkowite przychody:</span>
                      <span className="font-semibold text-green-600 text-lg">
                        {formatCurrency(budgetSummary.totalIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-200">
                      <span className="font-medium">Całkowite wydatki:</span>
                      <span className="font-semibold text-red-600 text-lg">
                        {formatCurrency(budgetSummary.totalExpenses)}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg border ${
                      budgetSummary.balance >= 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <span className="font-medium">Bilans:</span>
                      <span className={`font-bold text-xl ${
                        budgetSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {budgetSummary.balance >= 0 ? '+' : ''}
                        {formatCurrency(budgetSummary.balance)}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Financial Health Indicator */}
          <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
            <span className="font-semibold text-lg">Wskaźnik Zdrowia Finansowego:</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-2xl">{financialHealth.score}/100</span>
              <Badge variant={financialHealth.variant} className="text-sm px-3 py-1">
                {financialHealth.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetApp;
