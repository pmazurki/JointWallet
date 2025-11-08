import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Lock, Plus, Users, Share2, Copy, Check } from 'lucide-react';
import {
  Transaction,
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  RecurrencePeriod,
  BudgetSummary,
  FinancialHealth,
  AppData,
  Budget,
  BudgetType,
} from '@/types';
import { PINAuth } from './PINAuth';
import {
  saveEncryptedData,
  loadEncryptedData,
  setupPIN,
  isPINSetup,
  hasEncryptedData,
} from '@/lib/storage';
import { generateShareToken } from '@/lib/encryption';
import { calculate503020Rule } from '@/lib/budgetRules';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Jedzenie', 'Transport', 'Rozrywka', 'Mieszkanie', 'Inne'];
const INCOME_CATEGORIES: IncomeCategory[] = ['Wynagrodzenie', 'Freelance', 'Inwestycje', 'Prezent', 'Inne'];

const BudgetApp = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentPIN, setCurrentPIN] = useState<string>('');
  const [appData, setAppData] = useState<AppData | null>(null);
  const [activeBudgetId, setActiveBudgetId] = useState<string>('');

  // Transaction form state
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | IncomeCategory>('Jedzenie');
  const [amount, setAmount] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<RecurrencePeriod>('monthly');
  const [summaryPeriod, setSummaryPeriod] = useState<RecurrencePeriod>('monthly');

  // UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Initialize app data
  const initializeAppData = (): AppData => {
    const userId = Date.now().toString();
    const personalBudgetId = `budget-${userId}-personal`;

    return {
      version: '1.0.0',
      user: {
        id: userId,
        name: 'Użytkownik',
        createdAt: new Date(),
      },
      budgets: [
        {
          id: personalBudgetId,
          name: 'Budżet Osobisty',
          type: 'personal',
          transactions: [],
          createdAt: new Date(),
          color: '#3b82f6',
        },
      ],
      activeBudgetId: personalBudgetId,
    };
  };

  // Handle PIN setup (first time)
  const handlePINSetup = async (pin: string) => {
    try {
      await setupPIN(pin);
      setCurrentPIN(pin);

      // Initialize new app data
      const newAppData = initializeAppData();
      await saveEncryptedData(newAppData, pin);

      setAppData(newAppData);
      setActiveBudgetId(newAppData.activeBudgetId);
      setIsUnlocked(true);
    } catch (error) {
      console.error('Failed to setup PIN:', error);
      alert('Nie udało się ustawić PIN-u. Spróbuj ponownie.');
    }
  };

  // Handle unlock with existing PIN
  const handleUnlock = async (pin: string) => {
    try {
      const data = await loadEncryptedData<AppData>(pin);
      if (!data) {
        throw new Error('Nie znaleziono danych');
      }

      // Convert date strings back to Date objects
      const processedData: AppData = {
        ...data,
        user: {
          ...data.user,
          createdAt: new Date(data.user.createdAt),
        },
        budgets: data.budgets.map((budget) => ({
          ...budget,
          createdAt: new Date(budget.createdAt),
          transactions: budget.transactions.map((t) => ({
            ...t,
            date: new Date(t.date),
          })),
          shareInfo: budget.shareInfo
            ? {
                ...budget.shareInfo,
                createdAt: new Date(budget.shareInfo.createdAt),
                lastSyncedAt: budget.shareInfo.lastSyncedAt
                  ? new Date(budget.shareInfo.lastSyncedAt)
                  : undefined,
              }
            : undefined,
        })),
      };

      setCurrentPIN(pin);
      setAppData(processedData);
      setActiveBudgetId(processedData.activeBudgetId);
      setIsUnlocked(true);
    } catch (error) {
      console.error('Failed to unlock:', error);
      throw error;
    }
  };

  // Lock the app
  const lockApp = () => {
    setIsUnlocked(false);
    setCurrentPIN('');
    setAppData(null);
  };

  // Save app data
  const saveAppData = async (data: AppData) => {
    if (!currentPIN) return;
    try {
      await saveEncryptedData(data, currentPIN);
      setAppData(data);
    } catch (error) {
      console.error('Failed to save data:', error);
      alert('Nie udało się zapisać danych');
    }
  };

  // Get active budget
  const activeBudget = useMemo(() => {
    if (!appData) return null;
    return appData.budgets.find((b: Budget) => b.id === activeBudgetId) || null;
  }, [appData, activeBudgetId]);

  // Update selected category when transaction type changes
  useEffect(() => {
    if (transactionType === 'expense') {
      setSelectedCategory('Jedzenie');
    } else {
      setSelectedCategory('Wynagrodzenie');
    }
  }, [transactionType]);

  // Add transaction
  const addTransaction = () => {
    if (!appData || !activeBudget) return;

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

    const updatedBudgets = appData.budgets.map((budget: Budget) =>
      budget.id === activeBudgetId
        ? {
            ...budget,
            transactions: [newTransaction, ...budget.transactions],
          }
        : budget
    );

    saveAppData({
      ...appData,
      budgets: updatedBudgets,
    });

    setAmount('');
  };

  // Delete transaction
  const deleteTransaction = (id: string) => {
    if (!appData || !activeBudget) return;

    const updatedBudgets = appData.budgets.map((budget: Budget) =>
      budget.id === activeBudgetId
        ? {
            ...budget,
            transactions: budget.transactions.filter((t: Transaction) => t.id !== id),
          }
        : budget
    );

    saveAppData({
      ...appData,
      budgets: updatedBudgets,
    });
  };

  // Create new budget
  const createBudget = (name: string, type: BudgetType) => {
    if (!appData) return;

    const newBudget: Budget = {
      id: `budget-${Date.now()}`,
      name,
      type,
      transactions: [],
      createdAt: new Date(),
      color: type === 'shared' ? '#10b981' : '#3b82f6',
    };

    saveAppData({
      ...appData,
      budgets: [...appData.budgets, newBudget],
    });
  };

  // Share budget
  const shareBudget = () => {
    if (!appData || !activeBudget) return;

    const shareToken = generateShareToken();

    const updatedBudgets = appData.budgets.map((budget: Budget) =>
      budget.id === activeBudgetId
        ? {
            ...budget,
            shareInfo: {
              shareToken,
              sharedWith: [],
              createdAt: new Date(),
            },
          }
        : budget
    );

    saveAppData({
      ...appData,
      budgets: updatedBudgets,
    });

    setShowShareModal(true);
  };

  // Copy share link
  const copyShareLink = () => {
    if (!activeBudget?.shareInfo) return;

    const shareLink = `${window.location.origin}?join=${activeBudget.shareInfo.shareToken}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
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

  // Normalize transactions for period
  const normalizeTransactions = (transactions: Transaction[], period: RecurrencePeriod): Transaction[] => {
    const daysInPeriod = getDaysInPeriod(period);

    return transactions.map((transaction) => {
      if (transaction.isRecurring && transaction.recurrencePeriod) {
        const transactionDays = getDaysInPeriod(transaction.recurrencePeriod);
        const occurrences = daysInPeriod / transactionDays;
        return {
          ...transaction,
          amount: transaction.amount * occurrences,
        };
      }
      return transaction;
    });
  };

  // Calculate budget summary
  const budgetSummary = useMemo((): BudgetSummary => {
    if (!activeBudget) {
      return { totalIncome: 0, totalExpenses: 0, balance: 0 };
    }

    const normalized = normalizeTransactions(activeBudget.transactions, summaryPeriod);

    const totalIncome = normalized
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = normalized
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    };
  }, [activeBudget, summaryPeriod]);

  // Calculate financial health
  const financialHealth = useMemo((): FinancialHealth => {
    const { totalIncome, totalExpenses, balance } = budgetSummary;

    if (totalIncome === 0) {
      return { score: 0, status: 'Krytyczny', variant: 'destructive' };
    }

    const savingsRate = (balance / totalIncome) * 100;
    const expenseRatio = (totalExpenses / totalIncome) * 100;

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
  }, [budgetSummary]);

  // Calculate 50/30/20 rule
  const budgetRule = useMemo(() => {
    if (!activeBudget) return null;
    const normalized = normalizeTransactions(activeBudget.transactions, summaryPeriod);
    return calculate503020Rule(activeBudget.transactions, normalized);
  }, [activeBudget, summaryPeriod]);

  // Format functions
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

  // Show PIN auth if not unlocked
  if (!isUnlocked) {
    const needsSetup = !isPINSetup() || !hasEncryptedData();
    return (
      <PINAuth
        mode={needsSetup ? 'setup' : 'unlock'}
        onSuccess={needsSetup ? handlePINSetup : handleUnlock}
      />
    );
  }

  if (!appData || !activeBudget) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: activeBudget.color }}
              />
              <h2 className="text-3xl font-bold text-primary">{activeBudget.name}</h2>
              {activeBudget.type === 'shared' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Wspólny
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={lockApp}>
                <Lock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Budget Selector */}
          <div className="flex flex-wrap gap-2">
            {appData.budgets.map((budget: Budget) => (
              <Button
                key={budget.id}
                variant={activeBudgetId === budget.id ? 'default' : 'outline'}
                onClick={() => setActiveBudgetId(budget.id)}
                className="flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: budget.color }}
                />
                {budget.name}
                {budget.type === 'shared' && <Users className="w-3 h-3" />}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const name = prompt('Nazwa budżetu:');
                if (name) createBudget(name, 'personal');
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={shareBudget}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Udostępnij budżet
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const name = prompt('Nazwa wspólnego budżetu:');
                if (name) createBudget(name, 'shared');
              }}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Utwórz wspólny budżet
            </Button>
          </div>

          {/* Transaction Type Tabs */}
          <Tabs value={transactionType} onValueChange={(v: string) => setTransactionType(v as TransactionType)}>
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
              {activeBudget.transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Brak transakcji. Dodaj swoją pierwszą transakcję powyżej!
                </p>
              ) : (
                activeBudget.transactions.map((transaction) => (
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
            <Tabs value={summaryPeriod} onValueChange={(v: string) => setSummaryPeriod(v as RecurrencePeriod)}>
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

          {/* 50/30/20 Rule Analysis */}
          {budgetRule && budgetSummary.totalIncome > 0 && (
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-3">Analiza 50/30/20:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Potrzeby (50%):</span>
                  <span className="font-semibold">{formatCurrency(budgetRule.allocation.needs)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Przyjemności (30%):</span>
                  <span className="font-semibold">{formatCurrency(budgetRule.allocation.wants)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Oszczędności (20%):</span>
                  <span className={`font-semibold ${budgetRule.allocation.savings < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(budgetRule.allocation.savings)}
                  </span>
                </div>
                {budgetRule.warnings.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Ostrzeżenia:</p>
                    {budgetRule.warnings.map((warning, i) => (
                      <p key={i} className="text-sm text-orange-600 dark:text-orange-400">
                        • {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      {showShareModal && activeBudget.shareInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <h3 className="text-xl font-semibold">Udostępnij budżet</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Udostępnij poniższy link partnerowi, aby dołączył do tego budżetu:
              </p>
              <div className="p-3 bg-muted rounded-md break-all text-sm font-mono">
                {window.location.origin}?join={activeBudget.shareInfo.shareToken}
              </div>
              <div className="flex gap-2">
                <Button onClick={copyShareLink} className="flex-1 flex items-center gap-2">
                  {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedToken ? 'Skopiowano!' : 'Kopiuj link'}
                </Button>
                <Button variant="outline" onClick={() => setShowShareModal(false)}>
                  Zamknij
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BudgetApp;
