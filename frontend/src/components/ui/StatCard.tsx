import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  badge?: React.ReactNode;
  accentColor?: 'forest' | 'amber' | 'blue' | 'purple' | 'emerald';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  accentColor = 'forest',
  className,
}) => {
  const accentClasses = {
    forest: 'bg-forest-50 text-forest-800 border-forest-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-km p-4 sm:p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between gap-3',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            {value}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              'p-2.5 rounded-km border shrink-0 flex items-center justify-center',
              accentClasses[accentColor]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend || badge) && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5 font-semibold">
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
              <span
                className={cn(
                  trend.direction === 'up' && 'text-emerald-700',
                  trend.direction === 'down' && 'text-rose-700',
                  trend.direction === 'neutral' && 'text-slate-600'
                )}
              >
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
            </div>
          ) : subtitle ? (
            <span className="text-slate-500 truncate">{subtitle}</span>
          ) : <span />}

          {badge && <div>{badge}</div>}
        </div>
      )}
    </div>
  );
};
