'use client';

import { useState } from 'react';
import type { BreachCheckResult } from '@/types';

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function useBreachCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<BreachCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkPassword = async (password: string): Promise<BreachCheckResult> => {
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      // Hash the password
      const hash = await sha1(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Query the API with k-anonymity (only send first 5 chars of hash)
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      
      if (!response.ok) {
        throw new Error('Failed to check password breach status');
      }

      const text = await response.text();
      const lines = text.split('\n');

      // Check if our hash suffix is in the results
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix.trim().toUpperCase() === suffix) {
          const breachCount = parseInt(count.trim(), 10);
          const breachResult: BreachCheckResult = {
            breached: true,
            count: breachCount,
          };
          setResult(breachResult);
          setIsChecking(false);
          return breachResult;
        }
      }

      const safeResult: BreachCheckResult = { breached: false, count: 0 };
      setResult(safeResult);
      setIsChecking(false);
      return safeResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsChecking(false);
      throw err;
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    checkPassword,
    isChecking,
    result,
    error,
    reset,
  };
}
