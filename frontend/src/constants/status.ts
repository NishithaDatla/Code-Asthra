import type { AllBusinessStatus, StatusSeverity } from '../types';

export interface StatusConfig {
  label: string;
  severity: StatusSeverity;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const STATUS_CONFIG_MAP: Record<AllBusinessStatus, StatusConfig> = {
  // Booking Statuses
  PENDING: {
    label: 'Pending',
    severity: 'warning',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    severity: 'info',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500',
  },
  CHECKED_IN: {
    label: 'Checked In',
    severity: 'info',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  COMPLETED: {
    label: 'Completed',
    severity: 'success',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    severity: 'danger',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    dotClass: 'bg-rose-500',
  },
  NO_SHOW: {
    label: 'No Show',
    severity: 'neutral',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    dotClass: 'bg-slate-400',
  },

  // Queue Statuses
  WAITING: {
    label: 'Waiting in Queue',
    severity: 'warning',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  CALLED: {
    label: 'Token Called',
    severity: 'info',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
    dotClass: 'bg-sky-500',
  },
  IN_SERVICE: {
    label: 'In Service',
    severity: 'info',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  SKIPPED: {
    label: 'Skipped',
    severity: 'neutral',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-400',
  },

  // Procurement Flow Statuses
  BOOKED: {
    label: 'Booked',
    severity: 'info',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500',
  },
  VERIFICATION: {
    label: 'Farmer Verification',
    severity: 'warning',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  QUALITY_CHECK: {
    label: 'Quality Check',
    severity: 'info',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-200',
    dotClass: 'bg-purple-500',
  },
  WEIGHING: {
    label: 'Weighing Produce',
    severity: 'info',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-800',
    borderClass: 'border-cyan-200',
    dotClass: 'bg-cyan-500',
  },
  ACCEPTED: {
    label: 'Produce Accepted',
    severity: 'success',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Produce Rejected',
    severity: 'danger',
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
  },
  PROCUREMENT_COMPLETED: {
    label: 'Procurement Complete',
    severity: 'success',
    bgClass: 'bg-forest-50',
    textClass: 'text-forest-800',
    borderClass: 'border-forest-200',
    dotClass: 'bg-forest-600',
  },

  // Payment Statuses
  PROCESSING: {
    label: 'Processing Payment',
    severity: 'warning',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  FAILED: {
    label: 'Payment Failed',
    severity: 'danger',
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
  },

  // Centre Statuses
  OPEN: {
    label: 'Centre Open',
    severity: 'success',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Centre Closed',
    severity: 'neutral',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-500',
  },
  PAUSED: {
    label: 'Queue Paused',
    severity: 'warning',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },

  // Congestion Levels
  LOW: {
    label: 'Low Congestion',
    severity: 'success',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  MEDIUM: {
    label: 'Moderate Traffic',
    severity: 'warning',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  HIGH: {
    label: 'High Congestion',
    severity: 'danger',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    dotClass: 'bg-rose-500',
  },
};
