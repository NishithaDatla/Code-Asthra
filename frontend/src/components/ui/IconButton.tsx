import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import type { ComponentVariant, ComponentSize } from '../../types';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: ComponentVariant;
  size?: ComponentSize;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      ariaLabel,
      className,
      variant = 'ghost',
      size = 'md',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 rounded-km shrink-0';

    const variants: Record<ComponentVariant, string> = {
      primary: 'bg-forest-800 text-white hover:bg-forest-900 focus-visible:ring-forest-700',
      secondary: 'bg-forest-50 text-forest-800 hover:bg-forest-100 border border-forest-200',
      outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
      amber: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200',
    };

    const sizes: Record<ComponentSize, string> = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-11 w-11 text-sm',
      lg: 'h-13 w-13 text-base',
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
