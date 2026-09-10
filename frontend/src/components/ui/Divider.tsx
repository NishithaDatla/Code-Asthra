import React from 'react';
import { cn } from '../../lib/utils';

export interface DividerProps {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  orientation = 'horizontal',
  className,
}) => {
  if (orientation === 'vertical') {
    return <div className={cn('w-px h-full bg-slate-200 self-stretch mx-2', className)} />;
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3 my-4 w-full', className)}>
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
          {label}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
    );
  }

  return <hr className={cn('border-t border-slate-200 my-4 w-full', className)} />;
};
