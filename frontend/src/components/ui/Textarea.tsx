import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className, id, disabled, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-semibold text-slate-700 select-none">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full bg-white border border-slate-300 rounded-km px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm shadow-subtle transition-colors resize-y min-h-[80px]',
            'focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            error && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-rose-600 animate-fadeIn">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
