'use client';

import { useMemo } from 'react';
import type { PasswordStrength, PasswordStrengthResult } from '@/types';

export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => {
    if (!password) {
      return {
        score: 0,
        strength: 'weak' as PasswordStrength,
        label: 'No password',
        color: 'bg-gray-300',
      };
    }

    let score = 0;

    // Length scoring (up to 30 points)
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety scoring (up to 40 points)
    if (/[a-z]/.test(password)) score += 10; // lowercase
    if (/[A-Z]/.test(password)) score += 10; // uppercase
    if (/[0-9]/.test(password)) score += 10; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score += 10; // symbols

    // Pattern penalties
    if (/^[a-zA-Z]+$/.test(password)) score -= 10; // Only letters
    if (/^[0-9]+$/.test(password)) score -= 20; // Only numbers
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/^(123|abc|qwerty|password)/i.test(password)) score -= 20; // Common patterns

    // Bonus for length beyond 20
    if (password.length >= 20) score += 10;
    if (password.length >= 24) score += 10;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    let strength: PasswordStrength;
    let label: string;
    let color: string;

    if (score < 20) {
      strength = 'weak';
      label = 'Weak';
      color = 'bg-red-500';
    } else if (score < 40) {
      strength = 'fair';
      label = 'Fair';
      color = 'bg-orange-500';
    } else if (score < 60) {
      strength = 'good';
      label = 'Good';
      color = 'bg-yellow-500';
    } else if (score < 80) {
      strength = 'strong';
      label = 'Strong';
      color = 'bg-green-500';
    } else {
      strength = 'excellent';
      label = 'Excellent';
      color = 'bg-emerald-500';
    }

    return { score, strength, label, color };
  }, [password]);
}
