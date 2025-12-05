// Password Manager Types

export interface PasswordHistoryEntry {
  password: string;
  changedAt: string;
}

export interface Password {
  id: string;
  groupId: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  // New fields for password history and expiry
  passwordHistory?: PasswordHistoryEntry[];
  expiresAt?: string; // ISO date string when password should be rotated
  lastPasswordChange?: string; // ISO date string of last password change
  // TOTP fields
  totpSecret?: string; // Base32 encoded TOTP secret
  totpIssuer?: string; // TOTP issuer name
}

export interface Group {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TOTPEntry {
  id: string;
  name: string;
  issuer: string;
  secret: string; // Base32 encoded
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number; // Default 6
  period?: number; // Default 30 seconds
  createdAt: string;
}

export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

export interface PasswordStrengthResult {
  score: number; // 0-100
  strength: PasswordStrength;
  label: string;
  color: string;
}

export type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'updated';

export type ViewMode = 'grid' | 'list';

export interface AppState {
  groups: Group[];
  passwords: Password[];
  selectedGroupId: string | null;
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  theme: 'light' | 'dark' | 'system';
}

export interface BreachCheckResult {
  breached: boolean;
  count: number;
}
