'use client';

import { FolderOpen, Trash2, Edit2, MoreVertical, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useGroupPasswordCount, usePasswordStore } from '@/store/password-store';
import { cn } from '@/lib/utils';
import type { Group } from '@/types';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
}

export function GroupCard({ group, onEdit, onDelete }: GroupCardProps) {
  const { selectGroup, selectedGroupId } = usePasswordStore();
  const passwordCount = useGroupPasswordCount(group.id);
  const isSelected = selectedGroupId === group.id;

  return (
    <div
      className={cn(
        'glass-card p-5 cursor-pointer group relative overflow-hidden',
        'hover:border-purple-500/30',
        isSelected && 'ring-2 ring-purple-500/50 border-purple-500/30'
      )}
      onClick={() => selectGroup(group.id)}
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'p-3 rounded-xl transition-colors',
          isSelected 
            ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
            : 'bg-white/10 group-hover:bg-gradient-to-br group-hover:from-purple-500/80 group-hover:to-indigo-600/80'
        )}>
          <FolderOpen className="w-6 h-6 text-white" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass border-white/10">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-red-400 focus:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="font-semibold text-foreground mb-1 truncate">{group.name}</h3>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Key className="w-3.5 h-3.5" />
        <span>{passwordCount} {passwordCount === 1 ? 'password' : 'passwords'}</span>
      </div>

      <p className="text-xs text-muted-foreground/70 mt-3">
        Created {new Date(group.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
