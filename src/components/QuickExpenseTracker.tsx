import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Zap, DollarSign, AlertCircle } from 'lucide-react';
import { ExpenseCategory, Transaction } from '@/types';
import {
  reconcileWithBank,
  createAdjustmentTransaction,
} from '@/lib/bankReconciliation';

interface QuickExpenseTrackerProps {
  onAddTransaction: (transaction: Transaction) => void;
  transactions: Transaction[];
  currentBalance: number;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200];
const QUICK_CATEGORIES: ExpenseCategory[] = ['Jedzenie', 'Transport', 'Rozrywka'];

export function QuickExpenseTracker({
  onAddTransaction,
  transactions,
  currentBalance,
}: QuickExpenseTrackerProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Jedzenie');
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [bankBalance, setBankBalance] = useState('');

  // Quick add expense with predefined amount
  const handleQuickAdd = (amount: number) => {
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'expense',
      category: selectedCategory,
      amount,
      date: new Date(),
      isRecurring: false,
      description: `Szybki wydatek: ${selectedCategory}`,
    };

    onAddTransaction(transaction);
  };

  // Add custom amount
  const handleCustomAdd = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Podaj prawidłową kwotę');
      return;
    }

    handleQuickAdd(amount);
    setCustomAmount('');
  };

  // Reconcile with bank
  const handleReconcile = () => {
    const reportedBalance = parseFloat(bankBalance);
    if (isNaN(reportedBalance)) {
      alert('Podaj prawidłowe saldo z banku');
      return;
    }

    const reconciliation = reconcileWithBank(transactions, reportedBalance, 0);

    if (reconciliation.reconciled) {
      alert('✅ Saldo zgadza się! Brak różnic.');
    } else {
      const adjustmentTx = createAdjustmentTransaction(reconciliation);
      if (adjustmentTx) {
        const confirmMsg = `Różnica: ${reconciliation.difference.toFixed(2)} zł\n\nCzy dodać transakcję korygującą?`;
        if (confirm(confirmMsg)) {
          onAddTransaction(adjustmentTx);
          alert('Saldo skorygowane!');
        }
      }
    }

    setShowReconciliation(false);
    setBankBalance('');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' zł';
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Szybki Wydatek
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category selector */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handleQuickAdd(amount)}
                className="h-16 text-lg font-semibold"
              >
                {amount} zł
              </Button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Inna kwota..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCustomAdd();
                }
              }}
            />
            <Button onClick={handleCustomAdd}>Dodaj</Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            ⚡ Kliknij kwotę aby szybko dodać wydatek. Dokładną kwotę możesz skorygować później.
          </p>
        </CardContent>
      </Card>

      {/* Bank Reconciliation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            Korekta z Bankiem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Obecne saldo:</span>
            <span className="text-lg font-bold">{formatCurrency(currentBalance)}</span>
          </div>

          {!showReconciliation ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowReconciliation(true)}
            >
              Skoryguj z saldem bankowym
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Saldo z banku (zł)"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleReconcile} className="flex-1">
                  Skoryguj
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReconciliation(false);
                    setBankBalance('');
                  }}
                >
                  Anuluj
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Podaj dokładne saldo z aplikacji bankowej. System automatycznie doda transakcję korygującą jeśli będzie różnica.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Jak to działa?
              </p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• Szybko dodaj wydatek klikając kwotę</li>
                <li>• Na koniec dnia sprawdź saldo w banku</li>
                <li>• Kliknij "Skoryguj z saldem bankowym"</li>
                <li>• System automatycznie dopasuje różnice!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
