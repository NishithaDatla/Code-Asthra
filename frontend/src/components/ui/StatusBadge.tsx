import React from 'react';
import { cn } from '../../lib/utils';
import type { AllBusinessStatus } from '../../types';
import { STATUS_CONFIG_MAP } from '../../constants/status';

export interface StatusBadgeProps {
  status: AllBusinessStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'md',
  showDot = true,
  customLabel,
}) => {
  const config = STATUS_CONFIG_MAP[status] || {
    label: status,
    severity: 'neutral',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    dotClass: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 font-semibold gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-subtle tracking-wide select-none',
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', config.dotClass)}
        />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
};
