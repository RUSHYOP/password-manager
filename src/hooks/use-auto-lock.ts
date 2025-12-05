'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Hook to handle auto-locking the vault after inactivity
 * Monitors user activity and locks the vault when timeout is exceeded
 */
export function useAutoLock() {
  const { isUnlocked, updateActivity, checkAutoLock, autoLockTimeout } = useAuthStore();

  // Check for auto-lock periodically
  useEffect(() => {
    if (!isUnlocked) return;

    const intervalId = setInterval(() => {
      checkAutoLock();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [isUnlocked, checkAutoLock]);

  // Update activity on user interactions
  const handleActivity = useCallback(() => {
    if (isUnlocked) {
      updateActivity();
    }
  }, [isUnlocked, updateActivity]);

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    // Throttle activity updates
    let lastUpdate = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastUpdate > 1000) {
        lastUpdate = now;
        handleActivity();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
    };
  }, [isUnlocked, handleActivity]);

  // Handle visibility change (lock when tab is hidden for too long)
  useEffect(() => {
    if (!isUnlocked) return;

    let hiddenTime: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else if (hiddenTime) {
        const elapsed = Date.now() - hiddenTime;
        if (elapsed > autoLockTimeout) {
          checkAutoLock();
        }
        hiddenTime = null;
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked, autoLockTimeout, checkAutoLock, handleActivity]);

  return { updateActivity };
}
