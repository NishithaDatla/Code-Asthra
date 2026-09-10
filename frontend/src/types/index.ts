// Roles
export type UserRole = 'FARMER' | 'CENTRE_STAFF' | 'CENTRE_ADMIN' | 'SYSTEM_ADMIN';

// Business Status Types
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type QueueStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'SKIPPED';

export type ProcurementStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'VERIFICATION'
  | 'QUALITY_CHECK'
  | 'WEIGHING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PROCUREMENT_COMPLETED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type CentreStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'PAUSED';

export type CongestionLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export type AllBusinessStatus =
  | BookingStatus
  | QueueStatus
  | ProcurementStatus
  | PaymentStatus
  | CentreStatus
  | CongestionLevel;

// UI Component Base Types
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber';
export type ComponentSize = 'sm' | 'md' | 'lg';
export type StatusSeverity = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

// Toast Notification
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Navigation Item
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  roles?: UserRole[];
}

// Mock Data Models for Visual Dev
export interface Crop {
  id: string;
  name: string;
  category: string;
  grade: string;
  mspPerQuintal: number;
}

export interface ProcurementRequest {
  id: string;
  cropId: string;
  cropName: string;
  estimatedQuantityQuintals: number;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  centreName?: string;
}

export interface AvailabilitySlot {
  id: string;
  timeSlot: string;
  farmerCapacityRemaining: number;
  quantityCapacityQuintalsRemaining: number;
  isFullyBooked: boolean;
}

export interface SchedulingRecommendation {
  id: string;
  slotId: string;
  centreId: string;
  centreName: string;
  district: string;
  state: string;
  date: string;
  startTime: string;
  endTime: string;
  timeSlot: string;
  farmerCapacityRemaining: number;
  quantityCapacityQuintalsRemaining: number;
  congestion: CongestionLevel;
  recommendationReasons: string[];
  isFullyBooked: boolean;
}

export interface QueueEntry {
  id: string;
  bookingId: string;
  tokenNumber: string;
  status: QueueStatus;
  position: number;
  farmersAhead: number;
  estimatedWaitMinutes: number;
  serviceCounter: number;
  centreName: string;
  cropName: string;
  quantityQuintals: number;
  checkedInAt: string;
}

export type QualityStatus = 'PASSED' | 'FAILED' | 'CONDITIONAL';

export interface QualityCheck {
  status: QualityStatus;
  moistureContentPercent?: number;
  foreignMatterPercent?: number;
  gradeAssigned?: string;
  notes?: string;
}

export interface WeighingResult {
  grossWeightQuintals: number;
  tareWeightQuintals: number;
  netWeightQuintals: number;
  weighedAt?: string;
}

export interface ProcurementRecord {
  id: string;
  bookingId: string;
  cropName: string;
  estimatedQuantityQuintals: number;
  centreName: string;
  district: string;
  status: ProcurementStatus;
  qualityCheck?: QualityCheck;
  weighing?: WeighingResult;
  rejectionReason?: string;
  completedAt?: string;
  paymentId?: string;
}

export interface PaymentRecord {
  id: string;
  procurementId: string;
  amountFormatted: string;
  status: PaymentStatus;
  dbtReference?: string;
  paymentDate?: string;
  accountMasked?: string;
}

export interface MockCentre {
  id: string;
  name: string;
  district: string;
  state: string;
  status: CentreStatus;
  congestion: CongestionLevel;
  activeQueues: number;
  capacityPerDayKg: number;
  todaysProcuredKg: number;
  address?: string;
  totalCounters?: number;
  operatingHours?: string;
  contactPhone?: string;
}

export interface MockBooking {
  id: string;
  bookingNumber: string;
  farmerName: string;
  farmerPhone: string;
  centreName: string;
  cropType: string;
  quantityKg: number;
  slotDate: string;
  slotTime: string;
  status: BookingStatus;
  tokenNumber?: string;
}

export interface MockFarmerProfile {
  id: string;
  farmerCode: string;
  fullName: string;
  phone: string;
  email: string;
  district: string;
  state: string;
  village: string;
  pincode: string;
  landSizeAcres: number;
  address: string;
  bankName: string;
  bankAccountMasked: string;
  ifscCode: string;
  isDbtVerified: boolean;
}

export interface MockActivity {
  id: string;
  title: string;
  timestamp: string;
  type: 'booking' | 'queue' | 'procurement' | 'payment';
}
