'use client';

import { useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePasswordStore } from '@/store/password-store';
import type { Group } from '@/types';

interface GroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editGroup?: Group | null;
}

export function GroupForm({ open, onOpenChange, editGroup }: GroupFormProps) {
  const { addGroup, updateGroup } = usePasswordStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!editGroup;

  useEffect(() => {
    if (open) {
      setName(editGroup?.name || '');
      setError('');
    }
  }, [open, editGroup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Group name is required');
      return;
    }

    if (isEditing && editGroup) {
      updateGroup(editGroup.id, trimmedName);
    } else {
      addGroup(trimmedName);
    }

    onOpenChange(false);
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <DialogTitle>{isEditing ? 'Edit Group' : 'New Group'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEditing 
              ? 'Update the group name below.' 
              : 'Create a new group to organize your passwords.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              type="text"
              placeholder="e.g., Social Media, Work, Banking"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="glass-subtle border-white/10 focus:border-purple-500/50"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="glass-subtle border-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
            >
              {isEditing ? 'Save Changes' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
