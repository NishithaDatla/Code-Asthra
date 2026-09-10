import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'forest' | 'amber' | 'emerald' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = 'forest',
  size = 'md',
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const variants = {
    forest: 'bg-forest-800',
    amber: 'bg-amber-600',
    emerald: 'bg-emerald-600',
    blue: 'bg-blue-600',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 select-none">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-mono">{percentage}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-slate-200 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', variants[variant])}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};
