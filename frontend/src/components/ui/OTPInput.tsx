import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of single characters
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first empty input on mount if not filled
    if (value.length < length && inputRefs.current[value.length]) {
      // Avoid auto-focusing on mobile page load if unwanted, but helpful for UX
    }
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;

    // Handle character entry
    const newDigit = val.slice(-1);
    if (!/^\d$/.test(newDigit)) return; // numbers only

    const newOtp = digits.slice();
    newOtp[index] = newDigit;
    const combined = newOtp.join('');
    onChange(combined);

    // Auto focus next input
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newOtp = digits.slice();
        newOtp[index - 1] = '';
        onChange(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = digits.slice();
        newOtp[index] = '';
        onChange(newOtp.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1} of OTP`}
            className={cn(
              'w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold text-slate-900 bg-white border border-slate-300 rounded-km shadow-subtle transition-all',
              'focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700 focus:scale-105',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              error && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500',
              digits[index] && 'border-forest-600 bg-forest-50/20'
            )}
          />
        ))}
      </div>
      {error && <p className="text-xs font-medium text-rose-600 text-center animate-fadeIn">{error}</p>}
    </div>
  );
};
