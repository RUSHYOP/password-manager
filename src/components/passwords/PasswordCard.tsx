'use client';

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { usePasswordStore } from '@/store/password-store';
import { useClipboard, useBreachCheck, usePasswordStrength } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Password } from '@/types';

interface PasswordCardProps {
  password: Password;
  onEdit: () => void;
  onDelete: () => void;
  viewMode?: 'grid' | 'list';
}

export function PasswordCard({ password, onEdit, onDelete, viewMode = 'grid' }: PasswordCardProps) {
  const { toggleFavorite, groups } = usePasswordStore();
  const [showPassword, setShowPassword] = useState(false);
  const { copied: copiedUsername, copy: copyUsername } = useClipboard();
  const { copied: copiedPassword, copy: copyPassword } = useClipboard();
  const { checkPassword, isChecking, result: breachResult } = useBreachCheck();
  const { strength } = usePasswordStrength(password.password);

  const group = groups.find(g => g.id === password.groupId);

  const handleCopyUsername = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyUsername(password.username);
  };

  const handleCopyPassword = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyPassword(password.password);
  };

  const handleCheckBreach = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await checkPassword(password.password);
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (password.url) {
      let url = password.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  };

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'from-red-500 to-red-600';
      case 'fair': return 'from-orange-500 to-orange-600';
      case 'good': return 'from-yellow-500 to-yellow-600';
      case 'strong': return 'from-green-500 to-green-600';
      case 'excellent': return 'from-emerald-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (viewMode === 'list') {
    return (
      <TooltipProvider>
        <div className="glass-card p-4 flex items-center gap-4 group">
          {/* Strength indicator */}
          <div className={cn('w-1 h-12 rounded-full bg-gradient-to-b', getStrengthColor())} />
          
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{password.title}</h3>
              {password.isFavorite && (
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              )}
              {group && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {group.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{password.username}</p>
          </div>

          {/* Password */}
          <div className="flex items-center gap-2">
            <code className="font-password text-sm text-muted-foreground">
              {showPassword ? password.password : '••••••••••••'}
            </code>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showPassword ? 'Hide' : 'Show'}</TooltipContent>
            </Tooltip>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/10"
                  onClick={handleCopyUsername}
                >
                  {copiedUsername ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Username</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/10"
                  onClick={handleCopyPassword}
                >
                  {copiedPassword ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Password</TooltipContent>
            </Tooltip>
            {password.url && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10"
                    onClick={handleOpenUrl}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open URL</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/10"
                  onClick={() => toggleFavorite(password.id)}
                >
                  <Star className={cn('w-4 h-4', password.isFavorite && 'fill-amber-400 text-amber-400')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{password.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-white/10">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCheckBreach}>
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : breachResult?.breached ? (
                    <ShieldAlert className="w-4 h-4 mr-2 text-red-400" />
                  ) : breachResult ? (
                    <ShieldCheck className="w-4 h-4 mr-2 text-green-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 mr-2" />
                  )}
                  {isChecking ? 'Checking...' : breachResult?.breached 
                    ? `Found in ${breachResult.count.toLocaleString()} breaches` 
                    : breachResult 
                      ? 'Not found in breaches' 
                      : 'Check for Breaches'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 focus:text-red-300">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Grid view
  return (
    <TooltipProvider>
      <div className="glass-card p-5 group relative overflow-hidden">
        {/* Strength indicator bar */}
        <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', getStrengthColor())} />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{password.title}</h3>
              {password.isFavorite && (
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>
            {group && (
              <Badge variant="secondary" className="text-xs">
                {group.name}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-white/10">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFavorite(password.id)}>
                <Star className={cn('w-4 h-4 mr-2', password.isFavorite && 'fill-amber-400 text-amber-400')} />
                {password.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCheckBreach}>
                {isChecking ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : breachResult?.breached ? (
                  <ShieldAlert className="w-4 h-4 mr-2 text-red-400" />
                ) : breachResult ? (
                  <ShieldCheck className="w-4 h-4 mr-2 text-green-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 mr-2" />
                )}
                {isChecking ? 'Checking...' : breachResult?.breached 
                  ? `Breached (${breachResult.count.toLocaleString()}x)` 
                  : breachResult 
                    ? 'Safe' 
                    : 'Check Breaches'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-300">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Username */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Username</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground truncate flex-1">{password.username}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-white/10 shrink-0"
                  onClick={handleCopyUsername}
                >
                  {copiedUsername ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Username</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Password</p>
          <div className="flex items-center gap-2">
            <code className="font-password text-sm text-foreground truncate flex-1">
              {showPassword ? password.password : '••••••••••••'}
            </code>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-white/10 shrink-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showPassword ? 'Hide' : 'Show'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-white/10 shrink-0"
                  onClick={handleCopyPassword}
                >
                  {copiedPassword ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Password</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* URL if exists */}
        {password.url && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">Website</p>
            <button
              onClick={handleOpenUrl}
              className="text-sm text-purple-400 hover:text-purple-300 truncate flex items-center gap-1 transition-colors"
            >
              {password.url}
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Breach status indicator */}
        {breachResult && (
          <div className={cn(
            'flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg',
            breachResult.breached ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          )}>
            {breachResult.breached ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Found in {breachResult.count.toLocaleString()} data breaches</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Not found in any known breaches</span>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground/70 mt-4">
          Updated {new Date(password.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </TooltipProvider>
  );
}
