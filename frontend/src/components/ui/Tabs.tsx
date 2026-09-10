import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  if (variant === 'segmented') {
    return (
      <div className={cn('p-1 bg-slate-100 rounded-km flex items-center gap-1 overflow-x-auto select-none', className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex-1 min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap',
                isActive
                  ? 'bg-white text-forest-900 shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    isActive ? 'bg-forest-100 text-forest-800' : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('border-b border-slate-200 flex items-center gap-2 overflow-x-auto select-none', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap min-h-[44px]',
              isActive
                ? 'border-forest-800 text-forest-900 bg-forest-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold',
                  isActive ? 'bg-forest-100 text-forest-800' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
