'use client';

import { cn } from '@/lib/utils';
import { Bot, Zap } from 'lucide-react';
import type { ChatMode } from './types';

interface ModeSwitchProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ModeSwitch({ mode, onChange, disabled }: ModeSwitchProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
      <button
        type="button"
        onClick={() => onChange('normal')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          mode === 'normal'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Zap className="h-4 w-4" />
        Normal
      </button>
      <button
        type="button"
        onClick={() => onChange('ai_agent')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          mode === 'ai_agent'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Bot className="h-4 w-4" />
        AI Agent
      </button>
    </div>
  );
}
