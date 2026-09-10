import React from 'react';
import { cn } from '../../lib/utils';

export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('w-full overflow-x-auto rounded-km border border-slate-200 bg-white shadow-card', className)} {...props}>
    {children}
  </div>
);

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, className, ...props }) => (
  <table className={cn('w-full text-left text-sm border-collapse', className)} {...props}>
    {children}
  </table>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <thead className={cn('bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider select-none', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <tbody className={cn('divide-y divide-slate-100 bg-white text-slate-800', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...props }) => (
  <tr className={cn('hover:bg-slate-50/70 transition-colors', className)} {...props}>
    {children}
  </tr>
);

export const TableHeadCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <th className={cn('px-4 py-3.5 font-semibold text-xs tracking-wider text-slate-600', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <td className={cn('px-4 py-3.5 align-middle text-sm text-slate-700 whitespace-nowrap', className)} {...props}>
    {children}
  </td>
);
