import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      helperText,
      error,
      fullWidth = true,
      className,
      id,
      disabled,
      placeholder = 'Select an option',
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold text-slate-700 select-none">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'w-full bg-white border border-slate-300 rounded-km px-3.5 py-2.5 pr-10 text-slate-900 text-sm shadow-subtle transition-colors min-h-[44px] appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              error && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-600 animate-fadeIn">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
