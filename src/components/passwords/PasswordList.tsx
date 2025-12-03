'use client';

import { useState } from 'react';
import { Key, Plus, AlertTriangle, Search } from 'lucide-react';
import { PasswordCard } from './PasswordCard';
import { PasswordForm } from './PasswordForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePasswordStore, useFilteredPasswords } from '@/store/password-store';
import type { Password } from '@/types';
import { cn } from '@/lib/utils';

interface PasswordListProps {
  onNewPassword: () => void;
}

export function PasswordList({ onNewPassword }: PasswordListProps) {
  const { deletePassword, viewMode, searchQuery } = usePasswordStore();
  const passwords = useFilteredPasswords();
  const [editPassword, setEditPassword] = useState<Password | null>(null);
  const [deletePasswordId, setDeletePasswordId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEdit = (password: Password) => {
    setEditPassword(password);
    setShowEditDialog(true);
  };

  const handleDelete = (passwordId: string) => {
    setDeletePasswordId(passwordId);
  };

  const confirmDelete = () => {
    if (deletePasswordId) {
      deletePassword(deletePasswordId);
      setDeletePasswordId(null);
    }
  };

  const passwordToDelete = passwords.find((p) => p.id === deletePasswordId);

  // Separate favorites
  const favorites = passwords.filter((p) => p.isFavorite);
  const regular = passwords.filter((p) => !p.isFavorite);

  if (passwords.length === 0) {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-6 rounded-full bg-white/5 mb-6">
            <Search className="w-16 h-16 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            No passwords match your search for "{searchQuery}". Try a different search term.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-6 rounded-full bg-white/5 mb-6">
          <Key className="w-16 h-16 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No passwords yet</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Start by adding your first password to keep it safe and secure.
        </p>
        <Button
          onClick={onNewPassword}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Password
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="text-amber-400">★</span> Favorites
            </h3>
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-3'
              )}
            >
              {favorites.map((password) => (
                <PasswordCard
                  key={password.id}
                  password={password}
                  onEdit={() => handleEdit(password)}
                  onDelete={() => handleDelete(password.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Passwords */}
        {regular.length > 0 && (
          <div>
            {favorites.length > 0 && (
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                All Passwords
              </h3>
            )}
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-3'
              )}
            >
              {regular.map((password) => (
                <PasswordCard
                  key={password.id}
                  password={password}
                  onEdit={() => handleEdit(password)}
                  onDelete={() => handleDelete(password.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <PasswordForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editPassword={editPassword}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePasswordId} onOpenChange={(open) => !open && setDeletePasswordId(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <DialogTitle>Delete Password</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{passwordToDelete?.title}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletePasswordId(null)}
              className="glass-subtle border-white/10"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
