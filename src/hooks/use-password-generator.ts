'use client';

import { useState, useCallback } from 'react';
import type { PasswordGeneratorOptions } from '@/types';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const defaultOptions: PasswordGeneratorOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

export function usePasswordGenerator() {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(defaultOptions);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generate = useCallback((opts?: Partial<PasswordGeneratorOptions>) => {
    const finalOptions = { ...options, ...opts };
    
    let charset = '';
    if (finalOptions.uppercase) charset += UPPERCASE_CHARS;
    if (finalOptions.lowercase) charset += LOWERCASE_CHARS;
    if (finalOptions.numbers) charset += NUMBER_CHARS;
    if (finalOptions.symbols) charset += SYMBOL_CHARS;

    if (charset.length === 0) {
      charset = LOWERCASE_CHARS; // Default fallback
    }

    // Use crypto.getRandomValues for better randomness
    const array = new Uint32Array(finalOptions.length);
    crypto.getRandomValues(array);

    let password = '';
    for (let i = 0; i < finalOptions.length; i++) {
      password += charset[array[i] % charset.length];
    }

    // Ensure at least one character from each selected category
    const requiredChars: string[] = [];
    if (finalOptions.uppercase && !password.match(/[A-Z]/)) {
      requiredChars.push(UPPERCASE_CHARS[Math.floor(Math.random() * UPPERCASE_CHARS.length)]);
    }
    if (finalOptions.lowercase && !password.match(/[a-z]/)) {
      requiredChars.push(LOWERCASE_CHARS[Math.floor(Math.random() * LOWERCASE_CHARS.length)]);
    }
    if (finalOptions.numbers && !password.match(/[0-9]/)) {
      requiredChars.push(NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)]);
    }
    if (finalOptions.symbols && !password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/)) {
      requiredChars.push(SYMBOL_CHARS[Math.floor(Math.random() * SYMBOL_CHARS.length)]);
    }

    // Replace random positions with required characters
    let finalPassword = password.split('');
    requiredChars.forEach((char, index) => {
      const pos = Math.floor(Math.random() * finalPassword.length);
      finalPassword[pos] = char;
    });

    const result = finalPassword.join('');
    setGeneratedPassword(result);
    return result;
  }, [options]);

  const updateOptions = useCallback((newOptions: Partial<PasswordGeneratorOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  }, []);

  const resetOptions = useCallback(() => {
    setOptions(defaultOptions);
  }, []);

  return {
    options,
    generatedPassword,
    generate,
    updateOptions,
    resetOptions,
    setGeneratedPassword,
  };
}
