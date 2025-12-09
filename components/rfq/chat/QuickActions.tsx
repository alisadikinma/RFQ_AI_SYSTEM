'use client';

import { Button } from '@/components/ui/button';
import { ClipboardList, FileSpreadsheet, FileText, PenLine } from 'lucide-react';
import type { QuickActionType } from './types';

interface QuickActionsProps {
  onAction: (action: QuickActionType) => void;
  disabled?: boolean;
}

const actions: { id: QuickActionType; icon: typeof ClipboardList; label: string }[] = [
  { id: 'paste', icon: ClipboardList, label: 'Paste Stations' },
  { id: 'excel', icon: FileSpreadsheet, label: 'Upload Excel' },
  { id: 'pdf', icon: FileText, label: 'Upload PDF' },
  { id: 'manual', icon: PenLine, label: 'Manual Entry' },
];

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={() => onAction(action.id)}
          disabled={disabled}
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
