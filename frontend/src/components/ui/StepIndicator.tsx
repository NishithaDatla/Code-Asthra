import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export interface Step {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStepIndex: number; // 0-based
  onStepClick?: (index: number) => void;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  className,
}) => {
  return (
    <div className={cn('w-full py-2', className)}>
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center relative',
                !isLast && 'flex-1'
              )}
            >
              <div
                onClick={() => onStepClick && isCompleted && onStepClick(index)}
                className={cn(
                  'flex items-center gap-2 select-none',
                  onStepClick && isCompleted && 'cursor-pointer hover:opacity-80'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 border-2',
                    isCompleted && 'bg-forest-800 border-forest-800 text-white',
                    isCurrent && 'bg-amber-500 border-amber-500 text-white shadow-md ring-4 ring-amber-100',
                    !isCompleted && !isCurrent && 'bg-white border-slate-300 text-slate-400'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : index + 1}
                </div>

                <div className="hidden sm:flex flex-col">
                  <span
                    className={cn(
                      'text-xs font-bold leading-tight',
                      isCurrent && 'text-slate-900',
                      isCompleted && 'text-forest-900',
                      !isCompleted && !isCurrent && 'text-slate-400'
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-4 transition-colors',
                    isCompleted ? 'bg-forest-800' : 'bg-slate-200'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
