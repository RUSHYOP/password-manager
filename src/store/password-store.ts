'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Group, Password, SortOption, ViewMode } from '@/types';

interface PasswordStore {
  // State
  groups: Group[];
  passwords: Password[];
  selectedGroupId: string | null;
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
  
  // Group Actions
  addGroup: (name: string) => void;
  updateGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  selectGroup: (id: string | null) => void;
  
  // Password Actions
  addPassword: (password: Omit<Password, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePassword: (id: string, updates: Partial<Omit<Password, 'id' | 'createdAt'>>) => void;
  deletePassword: (id: string) => void;
  toggleFavorite: (id: string) => void;
  
  // UI Actions
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Data Actions
  importData: (data: { groups: Group[]; passwords: Password[] }) => void;
  exportData: () => { groups: Group[]; passwords: Password[] };
  clearAllData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const usePasswordStore = create<PasswordStore>()(
  persist(
    (set, get) => ({
      // Initial State
      groups: [],
      passwords: [],
      selectedGroupId: null,
      searchQuery: '',
      sortOption: 'newest',
      viewMode: 'grid',
      theme: 'dark',
      
      // Group Actions
      addGroup: (name) => {
        const now = new Date().toISOString();
        const newGroup: Group = {
          id: generateId(),
          name,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
      },
      
      updateGroup: (id, name) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? { ...group, name, updatedAt: new Date().toISOString() }
              : group
          ),
        }));
      },
      
      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          passwords: state.passwords.filter((password) => password.groupId !== id),
          selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
        }));
      },
      
      selectGroup: (id) => {
        set({ selectedGroupId: id });
      },
      
      // Password Actions
      addPassword: (passwordData) => {
        const now = new Date().toISOString();
        const newPassword: Password = {
          ...passwordData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ passwords: [...state.passwords, newPassword] }));
      },
      
      updatePassword: (id, updates) => {
        set((state) => ({
          passwords: state.passwords.map((password) =>
            password.id === id
              ? { ...password, ...updates, updatedAt: new Date().toISOString() }
              : password
          ),
        }));
      },
      
      deletePassword: (id) => {
        set((state) => ({
          passwords: state.passwords.filter((password) => password.id !== id),
        }));
      },
      
      toggleFavorite: (id) => {
        set((state) => ({
          passwords: state.passwords.map((password) =>
            password.id === id
              ? { ...password, isFavorite: !password.isFavorite, updatedAt: new Date().toISOString() }
              : password
          ),
        }));
      },
      
      // UI Actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      setSortOption: (option) => {
        set({ sortOption: option });
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
      
      // Data Actions
      importData: (data) => {
        set({
          groups: data.groups,
          passwords: data.passwords,
          selectedGroupId: null,
        });
      },
      
      exportData: () => {
        const state = get();
        return {
          groups: state.groups,
          passwords: state.passwords,
        };
      },
      
      clearAllData: () => {
        set({
          groups: [],
          passwords: [],
          selectedGroupId: null,
          searchQuery: '',
        });
      },
    }),
    {
      name: 'securevault-storage',
      partialize: (state) => ({
        groups: state.groups,
        passwords: state.passwords,
        theme: state.theme,
        viewMode: state.viewMode,
        sortOption: state.sortOption,
      }),
    }
  )
);

// Selector hooks for computed values
export const useFilteredPasswords = () => {
  const { passwords, selectedGroupId, searchQuery, sortOption } = usePasswordStore();
  
  let filtered = passwords;
  
  // Filter by group
  if (selectedGroupId) {
    filtered = filtered.filter((p) => p.groupId === selectedGroupId);
  }
  
  // Filter by search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        (p.url && p.url.toLowerCase().includes(query)) ||
        (p.notes && p.notes.toLowerCase().includes(query))
    );
  }
  
  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });
  
  // Put favorites first
  return sorted.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
};

export const useGroupPasswordCount = (groupId: string) => {
  const passwords = usePasswordStore((state) => state.passwords);
  return passwords.filter((p) => p.groupId === groupId).length;
};

export const useStats = () => {
  const { groups, passwords } = usePasswordStore();
  return {
    totalGroups: groups.length,
    totalPasswords: passwords.length,
    totalFavorites: passwords.filter((p) => p.isFavorite).length,
  };
};
