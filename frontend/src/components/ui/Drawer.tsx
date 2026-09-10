import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-y-0 flex max-w-full bg-white shadow-2xl transition-transform duration-300 z-10 w-full sm:w-96',
          position === 'right' ? 'right-0' : 'left-0'
        )}
      >
        <div className="flex flex-col w-full h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
            {title ? (
              <h3 className="text-base font-bold text-slate-900 font-heading">{title}</h3>
            ) : (
              <div />
            )}
            <IconButton icon={<X className="h-5 w-5" />} ariaLabel="Close drawer" onClick={onClose} />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
