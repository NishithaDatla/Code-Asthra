import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, checked, disabled, ...props }, ref) => {
    const radioId = id || (typeof label === 'string' ? `radio-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <label
        htmlFor={radioId}
        className={cn(
          'inline-flex items-start gap-3 select-none cursor-pointer group',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <div className="relative flex items-center mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 rounded-full border border-slate-300 bg-white transition-all flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-forest-700 peer-focus-visible:ring-offset-1',
              'peer-checked:border-forest-800 peer-checked:border-[6px]',
              'group-hover:border-forest-600'
            )}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-slate-800 leading-tight">{label}</span>}
            {description && <span className="text-xs text-slate-500 mt-0.5">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';
