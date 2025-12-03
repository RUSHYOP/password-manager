'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useClipboard(autoClearMs = 30000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Clear the "copied" state after 2 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);

      // Auto-clear clipboard after specified time for security
      if (autoClearMs > 0) {
        setTimeout(async () => {
          try {
            // Check if the clipboard still contains our text
            const currentText = await navigator.clipboard.readText();
            if (currentText === text) {
              await navigator.clipboard.writeText('');
            }
          } catch {
            // Clipboard read may fail due to permissions, ignore
          }
        }, autoClearMs);
      }

      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  }, [autoClearMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copied, copy };
}
