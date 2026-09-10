import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalResults?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalResults,
  pageSize = 10,
  className,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalResults || 0);

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 select-none text-xs text-slate-600', className)}>
      {typeof totalResults === 'number' ? (
        <div>
          Showing <span className="font-semibold text-slate-900">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalResults}</span> results
        </div>
      ) : (
        <div>
          Page <span className="font-semibold text-slate-900">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
