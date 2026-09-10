import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, checked, disabled, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-start gap-3 select-none cursor-pointer group',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <div className="relative flex items-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 rounded border border-slate-300 bg-white transition-all flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-forest-700 peer-focus-visible:ring-offset-1',
              'peer-checked:bg-forest-800 peer-checked:border-forest-800 peer-checked:text-white',
              'group-hover:border-forest-600'
            )}
          >
            <Check className="w-3.5 h-3.5 stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
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

Checkbox.displayName = 'Checkbox';
