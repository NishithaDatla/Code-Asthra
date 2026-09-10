import React from 'react';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  roleBadge?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  className,
  roleBadge,
}) => {
  const getInitials = (n?: string) => {
    if (!n) return '';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          'rounded-full bg-forest-100 text-forest-900 border border-forest-200 font-bold flex items-center justify-center overflow-hidden select-none shadow-subtle',
          sizes[size],
          className
        )}
      >
        {src ? (
          <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        ) : name ? (
          getInitials(name)
        ) : (
          <User className="h-1/2 w-1/2 text-forest-800" />
        )}
      </div>

      {roleBadge && (
        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-extrabold px-1 rounded-full border border-white uppercase">
          {roleBadge[0]}
        </span>
      )}
    </div>
  );
};
