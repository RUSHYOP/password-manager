'use client';

import { usePasswordStrength } from '@/hooks';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  showLabel?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({ 
  password, 
  showLabel = true,
  className 
}: PasswordStrengthMeterProps) {
  const { score, label, strength } = usePasswordStrength(password);

  if (!password) return null;

  const getColorClass = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-orange-500';
      case 'good': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      case 'excellent': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getTextColorClass = () => {
    switch (strength) {
      case 'weak': return 'text-red-400';
      case 'fair': return 'text-orange-400';
      case 'good': return 'text-yellow-400';
      case 'strong': return 'text-green-400';
      case 'excellent': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getColorClass()
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className={cn('font-medium', getTextColorClass())}>
            {label}
          </span>
          <span className="text-muted-foreground">
            {score}%
          </span>
        </div>
      )}
    </div>
  );
}
