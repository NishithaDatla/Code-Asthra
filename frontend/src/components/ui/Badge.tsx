import React from 'react';
import { cn } from '../../lib/utils';
import type { StatusSeverity } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusSeverity | 'forest' | 'amber' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon,
  ...props
}) => {
  const variants: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    forest: 'bg-forest-50 text-forest-800 border-forest-200',
    amber: 'bg-amber-100 text-amber-900 border-amber-300',
  };

  const dots: Record<string, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    forest: 'bg-forest-600',
    amber: 'bg-amber-600',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-subtle tracking-wide select-none',
        variants[variant] || variants.neutral,
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dots[variant] || dots.neutral)} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
