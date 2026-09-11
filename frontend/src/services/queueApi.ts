import { apiFetch } from './apiClient';

export interface BackendCounterInfo {
  id: string;
  counter_number: number;
  counter_name: string;
  is_active: boolean;
}

export interface BackendQueuePosition {
  position: number;
  peopleAhead: number;
  totalWaiting: number;
}

export interface BackendQueueETA {
  estimatedWaitTimeMinutes: number;
  estimatedStartTime: string | null;
}

export interface BackendQueueEntry {
  id: string;
  booking_id: string;
  centre_id: string;
  token_number: string;
  status: 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'SKIPPED';
  created_at: string;
  updated_at?: string;
  position?: number;
  estimated_wait_time_minutes?: number;
  estimated_start_time?: string | null;
  counter_id?: string | null;
  booking?: {
    id: string;
    booking_number: string;
    procurement_requests?: {
      crops?: {
        name: string;
      } | null;
      estimated_quantity_quintals?: number;
    } | null;
  } | null;
  centre?: {
    id: string;
    centre_code: string;
    name: string;
    district: string;
    state: string;
  } | null;
  counter?: BackendCounterInfo | null;
  queue_position?: BackendQueuePosition | null;
  eta?: BackendQueueETA | null;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  data: BackendQueueEntry;
}

export interface QueueStatusResponse {
  success: boolean;
  data: BackendQueueEntry;
  message?: string;
}

export const queueApi = {
  async checkIn(
    token: string,
    bookingId: string
  ): Promise<CheckInResponse> {
    return apiFetch<CheckInResponse>(`/api/queue/${bookingId}/check-in`, {
      method: 'POST',
      token,
    });
  },

  async getQueueStatus(
    token: string,
    bookingId: string
  ): Promise<QueueStatusResponse> {
    return apiFetch<QueueStatusResponse>(`/api/queue/${bookingId}`, {
      method: 'GET',
      token,
    });
  },
};
