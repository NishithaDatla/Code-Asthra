import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import type { ComponentVariant, ComponentSize } from '../../types';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ComponentVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none rounded-km';

    const variants: Record<ComponentVariant, string> = {
      primary:
        'bg-forest-800 text-white hover:bg-forest-900 focus-visible:ring-forest-700 shadow-sm',
      secondary:
        'bg-forest-50 text-forest-800 hover:bg-forest-100 border border-forest-200 focus-visible:ring-forest-500',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400 shadow-subtle',
      ghost:
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm',
      amber:
        'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500 shadow-sm',
    };

    const sizes: Record<ComponentSize, string> = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2', // 44px touch target for mobile!
      lg: 'text-base px-6 py-3.5 min-h-[52px] gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
