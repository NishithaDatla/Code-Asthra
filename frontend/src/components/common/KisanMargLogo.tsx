import React from 'react';
import { cn } from '../../lib/utils';
import { Sprout } from 'lucide-react';

export interface KisanMargLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const KisanMargLogo: React.FC<KisanMargLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubtitle = true,
  className,
}) => {
  const sizes = {
    sm: { icon: 'w-6 h-6 p-1', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-8 h-8 p-1.5', text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'w-11 h-11 p-2', text: 'text-2xl', sub: 'text-xs' },
  };

  const isLight = variant === 'light';

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'rounded-km flex items-center justify-center shadow-subtle shrink-0 transition-transform hover:scale-105',
          sizes[size].icon,
          isLight ? 'bg-white text-forest-800' : 'bg-forest-800 text-amber-400'
        )}
      >
        <Sprout className="w-full h-full stroke-[2.5]" />
      </div>
      <div className="flex flex-col justify-center">
        <span
          className={cn(
            'font-extrabold font-heading tracking-tight leading-none',
            sizes[size].text,
            isLight ? 'text-white' : 'text-slate-900'
          )}
        >
          Kisan<span className={isLight ? 'text-amber-400' : 'text-forest-800'}>Marg</span>
        </span>
        {showSubtitle && (
          <span
            className={cn(
              'font-semibold uppercase tracking-widest leading-none mt-1',
              sizes[size].sub,
              isLight ? 'text-forest-100/80' : 'text-slate-500'
            )}
          >
            Smart Procurement Flow
          </span>
        )}
      </div>
    </div>
  );
};
