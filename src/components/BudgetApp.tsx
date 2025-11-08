import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Share2, Users } from 'lucide-react';
import {
  Transaction,
  TransactionType,
  ExpenseCategory,
  IncomeCategory,
  RecurrencePeriod,
  BudgetSummary,
  FinancialHealth,
  SharedExpense,
  Participant,
} from '@/types';
import { createTransactionHash, createSharedExpenseHash } from '@/utils/hash';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Jedzenie', 'Transport', 'Rozrywka', 'Mieszkanie', 'Inne'];
const INCOME_CATEGORIES: IncomeCategory[] = ['Wynagrodzenie', 'Freelance', 'Inwestycje', 'Prezent', 'Inne'];

const BudgetApp = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | IncomeCategory>('Jedzenie');
  const [amount, setAmount] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<RecurrencePeriod>('monthly');
  const [summaryPeriod, setSummaryPeriod] = useState<RecurrencePeriod>('monthly');

  // Współdzielone wydatki
  const [showSharedExpenseModal, setShowSharedExpenseModal] = useState(false);
  const [sharedExpenseName, setSharedExpenseName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Ja', percentage: 50, color: '#3b82f6' },
    { id: '2', name: 'Partner', percentage: 50, color: '#10b981' }
  ]);
  const [currentUserId] = useState('1'); // ID aktualnego użytkownika

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

    // Load shared expenses
    const savedSharedExpenses = localStorage.getItem('sharedExpenses');
    if (savedSharedExpenses) {
      try {
        const parsed = JSON.parse(savedSharedExpenses);
        const withDates = parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
        }));
        setSharedExpenses(withDates);
      } catch (error) {
        console.error('Error loading shared expenses:', error);
      }
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  // Save shared expenses to localStorage
  useEffect(() => {
    if (sharedExpenses.length > 0) {
      localStorage.setItem('sharedExpenses', JSON.stringify(sharedExpenses));
    }
  }, [sharedExpenses]);

  // Update selected category when transaction type changes
  useEffect(() => {
    if (transactionType === 'expense') {
      setSelectedCategory('Jedzenie');
    } else {
      setSelectedCategory('Wynagrodzenie');
    }
  }, [transactionType]);

  const addTransaction = async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Proszę wprowadzić prawidłową kwotę');
      return;
    }

    const date = new Date();
    const hash = await createTransactionHash(
      transactionType,
      selectedCategory,
      numAmount,
      date,
      isRecurring,
      isRecurring ? recurrencePeriod : undefined
    );

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      hash,
      type: transactionType,
      category: selectedCategory,
      amount: numAmount,
      date,
      isRecurring,
      recurrencePeriod: isRecurring ? recurrencePeriod : undefined,
    };

    setTransactions([newTransaction, ...transactions]);
    setAmount('');
  };

  const addSharedExpense = async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Proszę wprowadzić prawidłową kwotę');
      return;
    }

    if (!sharedExpenseName.trim()) {
      alert('Proszę wprowadzić nazwę wydatku');
      return;
    }

    const totalPercentage = participants.reduce((sum, p) => sum + p.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('Suma procentów musi wynosić 100%');
      return;
    }

    const date = new Date();
    const hash = await createSharedExpenseHash(
      sharedExpenseName,
      numAmount,
      selectedCategory as ExpenseCategory,
      date,
      participants.map(p => p.id)
    );

    const newSharedExpense: SharedExpense = {
      id: Date.now().toString(),
      hash,
      name: sharedExpenseName,
      totalAmount: numAmount,
      category: selectedCategory as ExpenseCategory,
      date,
      isRecurring,
      recurrencePeriod: isRecurring ? recurrencePeriod : undefined,
      participants: [...participants],
      createdBy: currentUserId,
    };

    setSharedExpenses([newSharedExpense, ...sharedExpenses]);

    // Dodaj transakcję dla mojego udziału
    const myParticipant = participants.find(p => p.id === currentUserId);
    if (myParticipant) {
      const myShare = (numAmount * myParticipant.percentage) / 100;
      const myTransactionHash = await createTransactionHash(
        'expense',
        selectedCategory,
        myShare,
        date,
        isRecurring,
        isRecurring ? recurrencePeriod : undefined
      );

      const myTransaction: Transaction = {
        id: (Date.now() + 1).toString(),
        hash: myTransactionHash,
        type: 'expense',
        category: selectedCategory as ExpenseCategory,
        amount: myShare,
        date,
        isRecurring,
        recurrencePeriod: isRecurring ? recurrencePeriod : undefined,
        isShared: true,
        sharedExpenseId: newSharedExpense.id,
        myShare,
      };

      setTransactions([myTransaction, ...transactions]);
    }

    setAmount('');
    setSharedExpenseName('');
    setShowSharedExpenseModal(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const deleteSharedExpense = (id: string) => {
    // Usuń współdzielony wydatek
    setSharedExpenses(sharedExpenses.filter(e => e.id !== id));
    // Usuń powiązane transakcje
    setTransactions(transactions.filter(t => t.sharedExpenseId !== id));
  };

  const updateParticipantPercentage = (participantId: string, percentage: number) => {
    setParticipants(participants.map(p =>
      p.id === participantId ? { ...p, percentage } : p
    ));
  };

  const addParticipant = () => {
    const newId = (participants.length + 1).toString();
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    setParticipants([
      ...participants,
      {
        id: newId,
        name: `Osoba ${participants.length + 1}`,
        percentage: 0,
        color: colors[participants.length % colors.length]
      }
    ]);
  };

  const removeParticipant = (participantId: string) => {
    if (participants.length <= 2) {
      alert('Muszą być co najmniej 2 osoby');
      return;
    }
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const updateParticipantName = (participantId: string, name: string) => {
    setParticipants(participants.map(p =>
      p.id === participantId ? { ...p, name } : p
    ));
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

            {transactionType === 'expense' && (
              <Button
                onClick={() => setShowSharedExpenseModal(true)}
                variant="outline"
                className="min-w-[140px] flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Współdzielony
              </Button>
            )}
          </div>

          {/* Modal współdzielonego wydatku */}
          {showSharedExpenseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Współdzielony Wydatek
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nazwa wydatku */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nazwa wydatku</label>
                    <Input
                      placeholder="np. Czynsz, Media, Zakupy"
                      value={sharedExpenseName}
                      onChange={(e) => setSharedExpenseName(e.target.value)}
                    />
                  </div>

                  {/* Kategoria i kwota */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Kategoria</label>
                      <div className="flex flex-wrap gap-2">
                        {EXPENSE_CATEGORIES.map((category) => (
                          <Button
                            key={category}
                            size="sm"
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(category)}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Całkowita kwota</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Uczestnicy */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium">Podział kosztów</label>
                      <Button size="sm" variant="outline" onClick={addParticipant}>
                        + Dodaj osobę
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ borderLeftColor: participant.color, borderLeftWidth: '4px' }}
                        >
                          <div className="flex-1">
                            <Input
                              placeholder="Imię"
                              value={participant.name}
                              onChange={(e) => updateParticipantName(participant.id, e.target.value)}
                              className="mb-2"
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={participant.percentage}
                                onChange={(e) => updateParticipantPercentage(participant.id, parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                              <span className="text-sm">%</span>
                              {amount && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  = {formatCurrency((parseFloat(amount) || 0) * participant.percentage / 100)}
                                </span>
                              )}
                            </div>
                          </div>
                          {participants.length > 2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeParticipant(participant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Suma procentów */}
                    <div className="mt-3 p-2 rounded bg-muted">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Suma procentów:</span>
                        <span className={`font-bold ${
                          Math.abs(participants.reduce((sum, p) => sum + p.percentage, 0) - 100) < 0.01
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {participants.reduce((sum, p) => sum + p.percentage, 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Przyciski */}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={addSharedExpense} className="flex-1">
                      Utwórz współdzielony wydatek
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSharedExpenseModal(false);
                        setSharedExpenseName('');
                      }}
                    >
                      Anuluj
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                        {transaction.isShared && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            Współdzielony
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                      {transaction.hash && (
                        <div className="text-xs font-mono text-muted-foreground mt-1">
                          Hash: {transaction.hash.substring(0, 12)}...
                        </div>
                      )}
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

          {/* Shared Expenses Section */}
          {sharedExpenses.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Współdzielone Wydatki
              </h3>
              <div className="space-y-3">
                {sharedExpenses.map((expense) => {
                  const myParticipant = expense.participants.find(p => p.id === currentUserId);
                  const myShare = myParticipant ? (expense.totalAmount * myParticipant.percentage) / 100 : 0;

                  return (
                    <div
                      key={expense.id}
                      className="p-4 rounded-lg border border-purple-200 bg-purple-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg">{expense.name}</h4>
                            <Badge variant="outline">{expense.category}</Badge>
                            {expense.isRecurring && (
                              <Badge variant="outline" className="text-xs">
                                {getPeriodLabel(expense.recurrencePeriod!)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {formatDate(expense.date)}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-mono bg-white p-2 rounded border">
                            <span className="text-muted-foreground">Hash:</span>
                            <span className="text-purple-600 font-semibold">{expense.hash.substring(0, 16)}...</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSharedExpense(expense.id)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Total amount */}
                      <div className="mb-3 p-3 bg-white rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Całkowita kwota:</span>
                          <span className="font-bold text-lg text-purple-600">
                            {formatCurrency(expense.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Participants breakdown */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Podział:</span>
                        {expense.participants.map((participant) => {
                          const participantShare = (expense.totalAmount * participant.percentage) / 100;
                          const isMe = participant.id === currentUserId;

                          return (
                            <div
                              key={participant.id}
                              className={`flex justify-between items-center p-2 rounded ${
                                isMe ? 'bg-blue-100 border border-blue-300' : 'bg-white border'
                              }`}
                              style={{ borderLeftColor: participant.color, borderLeftWidth: '3px' }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {participant.name} {isMe && '(Ty)'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {participant.percentage}%
                                </Badge>
                              </div>
                              <span className="font-semibold">
                                {formatCurrency(participantShare)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* My share highlight */}
                      <div className="mt-3 p-3 bg-blue-600 text-white rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Twoja część do zapłaty:</span>
                          <span className="font-bold text-xl">
                            {formatCurrency(myShare)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
