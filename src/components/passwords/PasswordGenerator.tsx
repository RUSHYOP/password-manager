'use client';

import { RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePasswordGenerator, useClipboard } from '@/hooks';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { cn } from '@/lib/utils';

interface PasswordGeneratorProps {
  onUsePassword?: (password: string) => void;
  className?: string;
}

export function PasswordGenerator({ onUsePassword, className }: PasswordGeneratorProps) {
  const { options, generatedPassword, generate, updateOptions, setGeneratedPassword } = usePasswordGenerator();
  const { copied, copy } = useClipboard();

  const handleGenerate = () => {
    generate();
  };

  const handleCopy = () => {
    if (generatedPassword) {
      copy(generatedPassword);
    }
  };

  const handleUse = () => {
    if (generatedPassword && onUsePassword) {
      onUsePassword(generatedPassword);
    }
  };

  return (
    <div className={cn('space-y-4 p-4 rounded-xl bg-white/5 border border-white/10', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Password Generator</h4>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleGenerate}
          className="h-8 hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Generate
        </Button>
      </div>

      {/* Generated Password Display */}
      {generatedPassword && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 font-password text-sm break-all">
              {generatedPassword}
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopy}
              className="glass-subtle border-white/10 shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <PasswordStrengthMeter password={generatedPassword} />
          {onUsePassword && (
            <Button
              type="button"
              size="sm"
              onClick={handleUse}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
            >
              Use This Password
            </Button>
          )}
        </div>
      )}

      {/* Length Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-muted-foreground">Length</Label>
          <span className="text-xs font-medium text-foreground">{options.length}</span>
        </div>
        <Slider
          value={[options.length]}
          onValueChange={([value]) => updateOptions({ length: value })}
          min={8}
          max={64}
          step={1}
          className="w-full"
        />
      </div>

      {/* Character Options */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={options.uppercase}
            onCheckedChange={(checked) => updateOptions({ uppercase: !!checked })}
          />
          <span className="text-sm text-muted-foreground">Uppercase (A-Z)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={options.lowercase}
            onCheckedChange={(checked) => updateOptions({ lowercase: !!checked })}
          />
          <span className="text-sm text-muted-foreground">Lowercase (a-z)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={options.numbers}
            onCheckedChange={(checked) => updateOptions({ numbers: !!checked })}
          />
          <span className="text-sm text-muted-foreground">Numbers (0-9)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={options.symbols}
            onCheckedChange={(checked) => updateOptions({ symbols: !!checked })}
          />
          <span className="text-sm text-muted-foreground">Symbols (!@#$)</span>
        </label>
      </div>
    </div>
  );
}
