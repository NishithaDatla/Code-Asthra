import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Phone, CheckCircle2 } from 'lucide-react';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, label = 'Mobile Number', error, helperText, className, id, disabled, ...props }, ref) => {
    const inputId = id || 'farmer-phone-input';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip out non-digit characters
      const rawDigits = e.target.value.replace(/\D/g, '');
      // Max 10 digits for standard Indian mobile numbers
      const truncated = rawDigits.slice(0, 10);
      onChange(truncated);
    };

    const isValidLength = value.length === 10;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-700 select-none">
            {label} <span className="text-rose-500">*</span>
          </label>
        )}
        <div className="relative flex items-center">
          {/* Prefix badge */}
          <div className="absolute left-0 top-0 bottom-0 px-3 bg-slate-100 border-r border-slate-300 rounded-l-km flex items-center gap-1.5 text-slate-700 font-semibold text-sm select-none">
            <span className="text-base">🇮🇳</span>
            <span>+91</span>
          </div>

          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            disabled={disabled}
            value={value}
            onChange={handleInputChange}
            placeholder="98765 43210"
            className={cn(
              'w-full bg-white border border-slate-300 rounded-km pl-24 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 font-mono text-base tracking-wider shadow-subtle transition-colors min-h-[48px]',
              'focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              error && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500',
              isValidLength && 'border-emerald-600 focus:ring-emerald-600',
              className
            )}
            {...props}
          />

          <div className="absolute right-3 text-slate-400 flex items-center justify-center pointer-events-none">
            {isValidLength ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 animate-fadeIn" />
            ) : (
              <Phone className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>

        {error ? (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : (
          <p className="text-xs text-slate-500">Enter 10-digit mobile number registered with KisanMarg</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
