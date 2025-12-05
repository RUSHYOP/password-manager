'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LockScreenProps {
  mode: 'create' | 'unlock';
  onUnlock: (password: string) => Promise<boolean>;
  onReset?: () => void;
}

export function LockScreen({ mode, onUnlock, onReset }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'create') {
      if (password.length < 8) {
        setError('Master password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      const success = await onUnlock(password);
      if (!success) {
        setError(mode === 'create' ? 'Failed to create vault' : 'Incorrect master password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SecureVault</h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'create'
              ? 'Create your master password to secure your vault'
              : 'Enter your master password to unlock'}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Master Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="pr-10"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Master Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your master password"
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || (mode === 'create' && !confirmPassword)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating Vault...' : 'Unlocking...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? 'Create Vault' : 'Unlock Vault'}
                </>
              )}
            </Button>
          </form>

          {mode === 'create' && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-white/5">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Important:</strong> Your master password is the only way to access your vault.
                If you forget it, your data cannot be recovered. Choose a strong, memorable password.
              </p>
            </div>
          )}

          {mode === 'unlock' && onReset && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onReset}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                disabled={isLoading}
              >
                Forgot password? Reset vault (this will delete all data)
              </button>
            </div>
          )}
        </div>

        {/* Security info */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>🔒 Your data is encrypted with AES-256-GCM</p>
          <p className="mt-1">All encryption happens locally in your browser</p>
        </div>
      </div>
    </div>
  );
}
