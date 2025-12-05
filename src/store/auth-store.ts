'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  generateSalt,
  hashMasterPassword,
  verifyMasterPassword,
  encryptVault,
  decryptVault,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from '@/lib/crypto';
import type { Group, Password } from '@/types';

// Auto-lock timeout in milliseconds (5 minutes default)
const DEFAULT_AUTO_LOCK_TIMEOUT = 5 * 60 * 1000;

interface AuthState {
  // Vault setup state
  isVaultCreated: boolean;
  saltBase64: string | null;
  passwordHash: string | null;
  encryptedVault: string | null;
  
  // Session state (not persisted)
  isUnlocked: boolean;
  masterPassword: string | null;
  lastActivity: number;
  autoLockTimeout: number;
  
  // Actions
  createVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<{ groups: Group[]; passwords: Password[] } | null>;
  lockVault: () => void;
  saveVault: (data: { groups: Group[]; passwords: Password[] }) => Promise<void>;
  changeMasterPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateActivity: () => void;
  setAutoLockTimeout: (timeout: number) => void;
  checkAutoLock: () => boolean;
  resetVault: () => void;
}

// Session state that should not be persisted
const sessionDefaults = {
  isUnlocked: false,
  masterPassword: null,
  lastActivity: Date.now(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial persisted state
      isVaultCreated: false,
      saltBase64: null,
      passwordHash: null,
      encryptedVault: null,
      
      // Session state
      ...sessionDefaults,
      autoLockTimeout: DEFAULT_AUTO_LOCK_TIMEOUT,
      
      // Create a new vault with master password
      createVault: async (masterPassword: string) => {
        const salt = generateSalt();
        const saltBase64 = uint8ArrayToBase64(salt);
        const passwordHash = await hashMasterPassword(masterPassword, salt);
        
        // Create empty encrypted vault
        const emptyVault = { groups: [], passwords: [] };
        const encryptedVault = await encryptVault(emptyVault, masterPassword, salt);
        
        set({
          isVaultCreated: true,
          saltBase64,
          passwordHash,
          encryptedVault,
          isUnlocked: true,
          masterPassword,
          lastActivity: Date.now(),
        });
      },
      
      // Unlock the vault with master password
      unlockVault: async (masterPassword: string) => {
        const { saltBase64, passwordHash, encryptedVault } = get();
        
        if (!saltBase64 || !passwordHash || !encryptedVault) {
          return null;
        }
        
        const salt = base64ToUint8Array(saltBase64);
        const isValid = await verifyMasterPassword(masterPassword, salt, passwordHash);
        
        if (!isValid) {
          return null;
        }
        
        try {
          const vaultData = await decryptVault(encryptedVault, masterPassword, salt);
          
          set({
            isUnlocked: true,
            masterPassword,
            lastActivity: Date.now(),
          });
          
          return vaultData as { groups: Group[]; passwords: Password[] };
        } catch {
          return null;
        }
      },
      
      // Lock the vault
      lockVault: () => {
        set({
          isUnlocked: false,
          masterPassword: null,
        });
      },
      
      // Save vault data (encrypt and store)
      saveVault: async (data: { groups: Group[]; passwords: Password[] }) => {
        const { saltBase64, masterPassword, isUnlocked } = get();
        
        if (!saltBase64 || !masterPassword || !isUnlocked) {
          throw new Error('Vault is locked');
        }
        
        const salt = base64ToUint8Array(saltBase64);
        const encryptedVault = await encryptVault(data, masterPassword, salt);
        
        set({ encryptedVault, lastActivity: Date.now() });
      },
      
      // Change master password
      changeMasterPassword: async (currentPassword: string, newPassword: string) => {
        const { saltBase64, passwordHash, encryptedVault } = get();
        
        if (!saltBase64 || !passwordHash || !encryptedVault) {
          return false;
        }
        
        const currentSalt = base64ToUint8Array(saltBase64);
        const isValid = await verifyMasterPassword(currentPassword, currentSalt, passwordHash);
        
        if (!isValid) {
          return false;
        }
        
        try {
          // Decrypt with old password
          const vaultData = await decryptVault(encryptedVault, currentPassword, currentSalt);
          
          // Create new salt and encrypt with new password
          const newSalt = generateSalt();
          const newSaltBase64 = uint8ArrayToBase64(newSalt);
          const newPasswordHash = await hashMasterPassword(newPassword, newSalt);
          const newEncryptedVault = await encryptVault(
            vaultData as { groups: Group[]; passwords: Password[] },
            newPassword,
            newSalt
          );
          
          set({
            saltBase64: newSaltBase64,
            passwordHash: newPasswordHash,
            encryptedVault: newEncryptedVault,
            masterPassword: newPassword,
            lastActivity: Date.now(),
          });
          
          return true;
        } catch {
          return false;
        }
      },
      
      // Update last activity timestamp
      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },
      
      // Set auto-lock timeout
      setAutoLockTimeout: (timeout: number) => {
        set({ autoLockTimeout: timeout });
      },
      
      // Check if should auto-lock (returns true if locked)
      checkAutoLock: () => {
        const { isUnlocked, lastActivity, autoLockTimeout } = get();
        
        if (!isUnlocked) return false;
        
        const now = Date.now();
        if (now - lastActivity > autoLockTimeout) {
          get().lockVault();
          return true;
        }
        
        return false;
      },
      
      // Reset entire vault (dangerous - clears all data)
      resetVault: () => {
        set({
          isVaultCreated: false,
          saltBase64: null,
          passwordHash: null,
          encryptedVault: null,
          ...sessionDefaults,
        });
      },
    }),
    {
      name: 'securevault-auth',
      partialize: (state) => ({
        isVaultCreated: state.isVaultCreated,
        saltBase64: state.saltBase64,
        passwordHash: state.passwordHash,
        encryptedVault: state.encryptedVault,
        autoLockTimeout: state.autoLockTimeout,
      }),
    }
  )
);
