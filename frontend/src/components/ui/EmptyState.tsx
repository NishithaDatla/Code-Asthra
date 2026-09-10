import React from 'react';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 rounded-km bg-slate-50/50',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
        {icon || <Inbox className="h-7 w-7 text-slate-400" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 font-heading mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
