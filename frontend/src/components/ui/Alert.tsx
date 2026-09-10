import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface AlertProps {
  type?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const configs = {
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    },
    danger: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    },
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: <Info className="h-5 w-5 text-sky-600 shrink-0" />,
    },
  };

  const current = configs[type];

  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded-km border flex items-start gap-3 shadow-subtle text-sm',
        current.container,
        className
      )}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold leading-tight mb-1">{title}</h4>}
        <div className="text-xs sm:text-sm opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
