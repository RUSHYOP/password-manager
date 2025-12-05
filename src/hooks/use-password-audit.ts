'use client';

import { useMemo } from 'react';
import { usePasswordStore } from '@/store/password-store';
import type { Password } from '@/types';

export interface PasswordAuditResult {
  // Passwords that are reused (same password used for multiple entries)
  duplicatePasswords: Map<string, Password[]>;
  // Passwords that are expired or about to expire
  expiredPasswords: Password[];
  expiringPasswords: Password[];
  // Passwords that haven't been changed in a long time (90+ days)
  oldPasswords: Password[];
  // Weak passwords (based on length and complexity)
  weakPasswords: Password[];
  // Summary stats
  totalIssues: number;
  securityScore: number;
}

// Default expiry warning threshold (7 days before expiry)
const EXPIRY_WARNING_DAYS = 7;
// Default password age threshold (90 days)
const OLD_PASSWORD_DAYS = 90;

/**
 * Hook to audit passwords for security issues
 */
export function usePasswordAudit(): PasswordAuditResult {
  const passwords = usePasswordStore((state) => state.passwords);

  return useMemo(() => {
    const now = new Date();
    const expiryWarningDate = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
    const oldPasswordDate = new Date(now.getTime() - OLD_PASSWORD_DAYS * 24 * 60 * 60 * 1000);

    // Find duplicate passwords
    const passwordMap = new Map<string, Password[]>();
    for (const pwd of passwords) {
      const existing = passwordMap.get(pwd.password) || [];
      existing.push(pwd);
      passwordMap.set(pwd.password, existing);
    }
    
    const duplicatePasswords = new Map<string, Password[]>();
    for (const [hash, pwds] of passwordMap) {
      if (pwds.length > 1) {
        duplicatePasswords.set(hash, pwds);
      }
    }

    // Find expired passwords
    const expiredPasswords: Password[] = [];
    const expiringPasswords: Password[] = [];
    
    for (const pwd of passwords) {
      if (pwd.expiresAt) {
        const expiryDate = new Date(pwd.expiresAt);
        if (expiryDate < now) {
          expiredPasswords.push(pwd);
        } else if (expiryDate < expiryWarningDate) {
          expiringPasswords.push(pwd);
        }
      }
    }

    // Find old passwords (not changed in 90+ days)
    const oldPasswords: Password[] = [];
    for (const pwd of passwords) {
      const lastChange = pwd.lastPasswordChange 
        ? new Date(pwd.lastPasswordChange) 
        : new Date(pwd.createdAt);
      if (lastChange < oldPasswordDate) {
        oldPasswords.push(pwd);
      }
    }

    // Find weak passwords
    const weakPasswords: Password[] = [];
    for (const pwd of passwords) {
      if (isWeakPassword(pwd.password)) {
        weakPasswords.push(pwd);
      }
    }

    // Calculate total issues
    let duplicateCount = 0;
    for (const pwds of duplicatePasswords.values()) {
      duplicateCount += pwds.length;
    }
    
    const totalIssues = 
      duplicateCount + 
      expiredPasswords.length + 
      expiringPasswords.length + 
      oldPasswords.length + 
      weakPasswords.length;

    // Calculate security score (0-100)
    const securityScore = calculateSecurityScore({
      totalPasswords: passwords.length,
      duplicateCount,
      expiredCount: expiredPasswords.length,
      oldCount: oldPasswords.length,
      weakCount: weakPasswords.length,
    });

    return {
      duplicatePasswords,
      expiredPasswords,
      expiringPasswords,
      oldPasswords,
      weakPasswords,
      totalIssues,
      securityScore,
    };
  }, [passwords]);
}

/**
 * Check if a password is weak
 */
function isWeakPassword(password: string): boolean {
  // Too short
  if (password.length < 8) return true;

  // Common patterns
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^abc123/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
    /^monkey/i,
    /^dragon/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) return true;
  }

  // Check character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const varietyScore = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  // Weak if less than 2 character types or short length
  if (varietyScore < 2) return true;
  if (password.length < 12 && varietyScore < 3) return true;

  return false;
}

/**
 * Calculate overall security score
 */
function calculateSecurityScore(stats: {
  totalPasswords: number;
  duplicateCount: number;
  expiredCount: number;
  oldCount: number;
  weakCount: number;
}): number {
  if (stats.totalPasswords === 0) return 100;

  const { totalPasswords, duplicateCount, expiredCount, oldCount, weakCount } = stats;

  // Each category has a weight
  const duplicatePenalty = (duplicateCount / totalPasswords) * 30;
  const expiredPenalty = (expiredCount / totalPasswords) * 25;
  const oldPenalty = (oldCount / totalPasswords) * 20;
  const weakPenalty = (weakCount / totalPasswords) * 25;

  const totalPenalty = duplicatePenalty + expiredPenalty + oldPenalty + weakPenalty;
  
  return Math.max(0, Math.round(100 - totalPenalty));
}

/**
 * Get audit issue counts for a specific password
 */
export function getPasswordIssues(password: Password, allPasswords: Password[]): string[] {
  const issues: string[] = [];
  const now = new Date();
  const oldPasswordDate = new Date(now.getTime() - OLD_PASSWORD_DAYS * 24 * 60 * 60 * 1000);

  // Check for duplicates
  const duplicates = allPasswords.filter(
    (p) => p.id !== password.id && p.password === password.password
  );
  if (duplicates.length > 0) {
    issues.push(`Reused in ${duplicates.length} other ${duplicates.length === 1 ? 'entry' : 'entries'}`);
  }

  // Check for expiry
  if (password.expiresAt) {
    const expiryDate = new Date(password.expiresAt);
    if (expiryDate < now) {
      issues.push('Password has expired');
    } else {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
        issues.push(`Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`);
      }
    }
  }

  // Check for old password
  const lastChange = password.lastPasswordChange 
    ? new Date(password.lastPasswordChange) 
    : new Date(password.createdAt);
  if (lastChange < oldPasswordDate) {
    const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (24 * 60 * 60 * 1000));
    issues.push(`Not changed in ${daysSinceChange} days`);
  }

  // Check for weak password
  if (isWeakPassword(password.password)) {
    issues.push('Weak password');
  }

  return issues;
}
