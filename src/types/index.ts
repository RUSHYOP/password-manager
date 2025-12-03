// Password Manager Types

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
}

export interface Group {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
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
