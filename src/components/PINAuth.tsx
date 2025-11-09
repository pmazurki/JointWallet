import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lock, Unlock } from 'lucide-react';
import { validatePIN } from '../lib/encryption';

interface PINAuthProps {
  mode: 'setup' | 'unlock';
  onSuccess: (pin: string) => void;
  onError?: (error: string) => void;
}

export function PINAuth({ mode, onSuccess, onError }: PINAuthProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate PIN
      const validation = validatePIN(pin);
      if (!validation.valid) {
        setError(validation.error || 'Nieprawidłowy PIN');
        setLoading(false);
        return;
      }

      // Setup mode: confirm PIN matches
      if (mode === 'setup') {
        if (pin !== confirmPin) {
          setError('PIN-y nie są takie same');
          setLoading(false);
          return;
        }
      }

      // Success!
      onSuccess(pin);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Wystąpił błąd';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isSetupMode = mode === 'setup';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            {isSetupMode ? (
              <Lock className="w-8 h-8 text-primary" />
            ) : (
              <Unlock className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isSetupMode ? 'Ustaw PIN' : 'Odblokuj aplikację'}
          </CardTitle>
          <CardDescription>
            {isSetupMode
              ? 'Utwórz PIN, który będzie chronił Twoje budżety'
              : 'Wprowadź swój PIN, aby uzyskać dostęp'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder={isSetupMode ? 'Wprowadź PIN (min. 4 znaki)' : 'Wprowadź PIN'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-lg tracking-widest"
                autoFocus
                maxLength={20}
                disabled={loading}
              />
            </div>

            {isSetupMode && (
              <div>
                <Input
                  type="password"
                  placeholder="Potwierdź PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={20}
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !pin || (isSetupMode && !confirmPin)}
            >
              {loading ? 'Przetwarzanie...' : isSetupMode ? 'Ustaw PIN' : 'Odblokuj'}
            </Button>

            {isSetupMode && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                PIN będzie używany do zabezpieczenia wszystkich Twoich danych budżetowych.
                Upewnij się, że go zapamiętasz - nie można go odzyskać!
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
