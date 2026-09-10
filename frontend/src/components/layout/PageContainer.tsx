import React from 'react';
import { cn } from '../../lib/utils';

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'xl',
  className,
}) => {
  const widths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <main className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8', widths[maxWidth], className)}>
      {children}
    </main>
  );
};

export interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
}) => {
  return (
    <section className={cn('mb-8 flex flex-col gap-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-900 font-heading">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
