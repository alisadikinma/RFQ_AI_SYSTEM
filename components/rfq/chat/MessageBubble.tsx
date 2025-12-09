'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import type { ChatMessage, InferredStation } from './types';

interface MessageBubbleProps {
  message: ChatMessage;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export function MessageBubble({ message, onAction }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : '')}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Name */}
        <span className="text-xs text-muted-foreground mb-1">
          {isUser ? 'You' : 'RFQ Assistant'}
        </span>

        {/* Message */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Stations from data */}
        {message.data?.stations && message.data.stations.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 w-full">
            <p className="text-sm font-medium mb-2">Recommended Stations:</p>
            <div className="flex flex-wrap gap-1.5">
              {message.data.stations.map((s, j) => (
                <Badge
                  key={j}
                  variant="secondary"
                  className="font-mono"
                  title={s.reason}
                >
                  {s.code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations from attachments (legacy support) */}
        {message.attachments?.map((att, i) =>
          att.type === 'recommendation' ? (
            <div
              key={i}
              className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 w-full"
            >
              <p className="text-sm font-medium mb-2">Recommended Stations:</p>
              <div className="flex flex-wrap gap-1">
                {(att.data as InferredStation[]).map((s, j) => (
                  <Badge key={j} variant="secondary" className="font-mono">
                    {s.code}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null
        )}

        {/* Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {message.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onAction?.(action.action, action.data)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
