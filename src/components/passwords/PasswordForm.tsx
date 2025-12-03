'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Wand2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePasswordStore } from '@/store/password-store';
import { PasswordGenerator } from './PasswordGenerator';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import type { Password } from '@/types';

interface PasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPassword?: Password | null;
  defaultGroupId?: string | null;
}

export function PasswordForm({ open, onOpenChange, editPassword, defaultGroupId }: PasswordFormProps) {
  const { groups, addPassword, updatePassword } = usePasswordStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    groupId: '',
  });

  const isEditing = !!editPassword;

  useEffect(() => {
    if (open) {
      if (editPassword) {
        setFormData({
          title: editPassword.title,
          username: editPassword.username,
          password: editPassword.password,
          url: editPassword.url || '',
          notes: editPassword.notes || '',
          groupId: editPassword.groupId,
        });
      } else {
        setFormData({
          title: '',
          username: '',
          password: '',
          url: '',
          notes: '',
          groupId: defaultGroupId || groups[0]?.id || '',
        });
      }
      setErrors({});
      setShowPassword(false);
      setShowGenerator(false);
    }
  }, [open, editPassword, defaultGroupId, groups]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleUseGeneratedPassword = (password: string) => {
    handleChange('password', password);
    setShowGenerator(false);
    setShowPassword(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    if (!formData.groupId) {
      newErrors.groupId = 'Please select a group';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (isEditing && editPassword) {
      updatePassword(editPassword.id, {
        title: formData.title.trim(),
        username: formData.username.trim(),
        password: formData.password,
        url: formData.url.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        groupId: formData.groupId,
      });
    } else {
      addPassword({
        title: formData.title.trim(),
        username: formData.username.trim(),
        password: formData.password,
        url: formData.url.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        groupId: formData.groupId,
        isFavorite: false,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <Key className="w-5 h-5 text-white" />
            </div>
            <DialogTitle>{isEditing ? 'Edit Password' : 'New Password'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? 'Update the password details below.'
              : 'Add a new password to your vault.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Selection */}
          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start glass-subtle border-white/10"
                >
                  {groups.find((g) => g.id === formData.groupId)?.name || 'Select a group...'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full glass border-white/10">
                {groups.map((group) => (
                  <DropdownMenuItem
                    key={group.id}
                    onClick={() => handleChange('groupId', group.id)}
                    className={formData.groupId === group.id ? 'bg-purple-500/20' : ''}
                  >
                    {group.name}
                  </DropdownMenuItem>
                ))}
                {groups.length === 0 && (
                  <DropdownMenuItem disabled>
                    No groups yet. Create a group first.
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.groupId && <p className="text-sm text-red-400">{errors.groupId}</p>}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Gmail, Netflix, Bank Account"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="glass-subtle border-white/10 focus:border-purple-500/50"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username / Email</Label>
            <Input
              id="username"
              type="text"
              placeholder="username@example.com"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="glass-subtle border-white/10 focus:border-purple-500/50"
            />
            {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGenerator(!showGenerator)}
                className="h-7 text-xs hover:bg-white/10"
              >
                <Wand2 className="w-3.5 h-3.5 mr-1" />
                Generate
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="glass-subtle border-white/10 focus:border-purple-500/50 pr-10 font-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.password && (
              <PasswordStrengthMeter password={formData.password} />
            )}
            {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
          </div>

          {/* Password Generator */}
          {showGenerator && (
            <PasswordGenerator onUsePassword={handleUseGeneratedPassword} />
          )}

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Website URL (optional)</Label>
            <Input
              id="url"
              type="text"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className="glass-subtle border-white/10 focus:border-purple-500/50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="flex w-full rounded-md glass-subtle border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
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
              {isEditing ? 'Save Changes' : 'Add Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
