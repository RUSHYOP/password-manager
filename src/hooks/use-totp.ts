'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateTOTP, getTOTPTimeRemaining, type TOTPAlgorithm } from '@/lib/totp';

interface UseTOTPOptions {
  secret: string;
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
}

interface UseTOTPResult {
  code: string;
  timeRemaining: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to generate and manage TOTP codes
 */
export function useTOTP(options: UseTOTPOptions | null): UseTOTPResult {
  const [code, setCode] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const period = options?.period ?? 30;

  const generateCode = useCallback(async () => {
    if (!options?.secret) {
      setCode('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newCode = await generateTOTP({
        secret: options.secret,
        algorithm: options.algorithm,
        digits: options.digits,
        period: options.period,
      });
      setCode(newCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate TOTP');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  }, [options?.secret, options?.algorithm, options?.digits, options?.period]);

  // Generate code on mount and when options change
  useEffect(() => {
    generateCode();
  }, [generateCode]);

  // Update time remaining every second
  useEffect(() => {
    const updateTimeRemaining = () => {
      setTimeRemaining(getTOTPTimeRemaining(period));
    };

    updateTimeRemaining();
    const intervalId = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(intervalId);
  }, [period]);

  // Regenerate code when time period resets
  useEffect(() => {
    if (timeRemaining === period) {
      generateCode();
    }
  }, [timeRemaining, period, generateCode]);

  return {
    code,
    timeRemaining,
    isLoading,
    error,
    refresh: generateCode,
  };
}
