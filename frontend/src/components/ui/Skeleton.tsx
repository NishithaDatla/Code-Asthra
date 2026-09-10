import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading data...',
  className,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-slate-500 gap-3', className)}>
      <Loader2 className={cn('animate-spin text-forest-800', iconSizes[size])} />
      {label && <p className="text-xs sm:text-sm font-medium text-slate-600 animate-pulse">{label}</p>}
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  circle = false,
  style,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-slate-200 animate-pulse',
        circle ? 'rounded-full' : 'rounded-km',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};
