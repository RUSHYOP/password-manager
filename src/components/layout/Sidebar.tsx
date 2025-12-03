'use client';

import { useState } from 'react';
import {
  Shield,
  Plus,
  FolderOpen,
  Star,
  Settings,
  Sun,
  Moon,
  Download,
  Upload,
  Trash2,
  Key,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { usePasswordStore, useStats, useGroupPasswordCount } from '@/store/password-store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNewGroup: () => void;
  onNewPassword: () => void;
  onImport: () => void;
  onExport: () => void;
}

function GroupItem({ 
  id, 
  name, 
  isSelected, 
  onClick 
}: { 
  id: string; 
  name: string; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const count = useGroupPasswordCount(id);
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
        'hover:bg-white/10 group',
        isSelected && 'bg-white/15 shadow-lg'
      )}
    >
      <FolderOpen className={cn(
        'w-4 h-4 transition-colors',
        isSelected ? 'text-purple-400' : 'text-muted-foreground group-hover:text-purple-400'
      )} />
      <span className={cn(
        'flex-1 truncate text-sm font-medium',
        isSelected ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {name}
      </span>
      <span className={cn(
        'text-xs px-2 py-0.5 rounded-full transition-colors',
        isSelected 
          ? 'bg-purple-500/20 text-purple-300' 
          : 'bg-white/5 text-muted-foreground'
      )}>
        {count}
      </span>
      <ChevronRight className={cn(
        'w-4 h-4 transition-all opacity-0 -translate-x-2',
        'group-hover:opacity-100 group-hover:translate-x-0',
        isSelected && 'opacity-100 translate-x-0 text-purple-400'
      )} />
    </button>
  );
}

export function Sidebar({ onNewGroup, onNewPassword, onImport, onExport }: SidebarProps) {
  const { groups, selectedGroupId, selectGroup, theme, setTheme, viewMode, setViewMode, clearAllData } = usePasswordStore();
  const stats = useStats();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAllData();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <TooltipProvider>
      <aside className="w-72 h-screen glass flex flex-col border-r border-white/10">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">SecureVault</h1>
              <p className="text-xs text-muted-foreground">Password Manager</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-2">
            <Button
              onClick={onNewPassword}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40"
            >
              <Key className="w-4 h-4 mr-2" />
              New Password
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewGroup}
                  variant="outline"
                  size="icon"
                  className="glass-subtle border-white/10 hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Group</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Groups
            </h2>
            <div className="space-y-1">
              <button
                onClick={() => selectGroup(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                  'hover:bg-white/10 group',
                  !selectedGroupId && 'bg-white/15 shadow-lg'
                )}
              >
                <LayoutGrid className={cn(
                  'w-4 h-4 transition-colors',
                  !selectedGroupId ? 'text-purple-400' : 'text-muted-foreground group-hover:text-purple-400'
                )} />
                <span className={cn(
                  'flex-1 text-sm font-medium',
                  !selectedGroupId ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  All Passwords
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full transition-colors',
                  !selectedGroupId 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'bg-white/5 text-muted-foreground'
                )}>
                  {stats.totalPasswords}
                </span>
              </button>
              
              {groups.map((group) => (
                <GroupItem
                  key={group.id}
                  id={group.id}
                  name={group.name}
                  isSelected={selectedGroupId === group.id}
                  onClick={() => selectGroup(group.id)}
                />
              ))}
            </div>
          </div>

          {groups.length === 0 && (
            <div className="text-center py-8 px-4">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No groups yet</p>
              <Button
                onClick={onNewGroup}
                variant="outline"
                size="sm"
                className="glass-subtle border-white/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-purple-400">{stats.totalGroups}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-indigo-400">{stats.totalPasswords}</p>
              <p className="text-xs text-muted-foreground">Passwords</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-amber-400">{stats.totalFavorites}</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onImport}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onExport}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleClearAll}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 hover:bg-white/10',
                      showClearConfirm && 'text-red-400 hover:text-red-300'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showClearConfirm ? 'Click again to confirm' : 'Clear All Data'}
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10"
                  >
                    {viewMode === 'grid' ? (
                      <List className="w-4 h-4" />
                    ) : (
                      <LayoutGrid className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
