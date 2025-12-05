'use client';

import { useState, useEffect } from 'react';
import { Shield, Copy, Check, RefreshCw, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useTOTP } from '@/hooks/use-totp';
import { useClipboard } from '@/hooks';
import { parseOTPAuthURI, generateTOTPSecret } from '@/lib/totp';
import { cn } from '@/lib/utils';
import type { TOTPAlgorithm } from '@/lib/totp';

interface TOTPDisplayProps {
  secret: string;
  issuer?: string;
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
  onRemove?: () => void;
  label?: string;
}

export function TOTPDisplay({
  secret,
  issuer,
  algorithm = 'SHA1',
  digits = 6,
  period = 30,
  onRemove,
  label,
}: TOTPDisplayProps) {
  const { code, timeRemaining, isLoading, error, refresh } = useTOTP({
    secret,
    algorithm,
    digits,
    period,
  });
  const { copied, copy } = useClipboard();

  const progressPercent = (timeRemaining / period) * 100;

  const handleCopy = () => {
    if (code) {
      copy(code);
    }
  };

  return (
    <TooltipProvider>
      <div className="glass-subtle rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {label || issuer || '2FA Code'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-white/10"
                  onClick={refresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            {onRemove && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-white/10 text-destructive"
                    onClick={onRemove}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <code className="text-2xl font-mono font-bold tracking-widest text-foreground">
                  {code ? `${code.slice(0, 3)} ${code.slice(3)}` : '--- ---'}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white/10"
                      onClick={handleCopy}
                      disabled={!code}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy code</TooltipContent>
                </Tooltip>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-1000 ease-linear rounded-full',
                    progressPercent > 30 ? 'bg-primary' : 'bg-amber-500'
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Expires in {timeRemaining}s
              </p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface TOTPSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { secret: string; issuer: string }) => void;
}

export function TOTPSetupDialog({ open, onOpenChange, onSave }: TOTPSetupDialogProps) {
  const [mode, setMode] = useState<'manual' | 'uri'>('manual');
  const [secret, setSecret] = useState('');
  const [issuer, setIssuer] = useState('');
  const [uri, setUri] = useState('');
  const [error, setError] = useState('');

  const handleGenerateSecret = () => {
    setSecret(generateTOTPSecret());
  };

  const handleParseUri = () => {
    setError('');
    const parsed = parseOTPAuthURI(uri);
    if (parsed) {
      setSecret(parsed.secret);
      setIssuer(parsed.issuer || parsed.label || '');
      setMode('manual');
    } else {
      setError('Invalid otpauth:// URI');
    }
  };

  const handleSave = () => {
    if (!secret.trim()) {
      setError('Secret is required');
      return;
    }
    onSave({ secret: secret.trim(), issuer: issuer.trim() });
    // Reset form
    setSecret('');
    setIssuer('');
    setUri('');
    setError('');
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setSecret('');
      setIssuer('');
      setUri('');
      setError('');
      setMode('manual');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Add 2FA Authentication
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('manual')}
              className={mode !== 'manual' ? 'glass-subtle border-white/10' : ''}
            >
              Manual Entry
            </Button>
            <Button
              variant={mode === 'uri' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('uri')}
              className={mode !== 'uri' ? 'glass-subtle border-white/10' : ''}
            >
              From URI
            </Button>
          </div>

          {mode === 'manual' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer / Service Name</Label>
                <Input
                  id="issuer"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g., Google, GitHub"
                  className="glass-subtle border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret Key (Base32)</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value.toUpperCase())}
                    placeholder="JBSWY3DPEHPK3PXP"
                    className="glass-subtle border-white/10 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateSecret}
                    className="glass-subtle border-white/10 shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="uri">OTPAuth URI</Label>
              <Input
                id="uri"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="otpauth://totp/..."
                className="glass-subtle border-white/10 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleParseUri}
                className="glass-subtle border-white/10"
              >
                Parse URI
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="glass-subtle border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Plus className="w-4 h-4 mr-2" />
              Add 2FA
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
