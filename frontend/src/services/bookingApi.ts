import { apiFetch } from './apiClient';

export interface CreateBookingPayload {
  procurement_request_id: string;
  slot_id: string;
}

export interface RescheduleBookingPayload {
  new_slot_id: string;
}

export interface BackendBooking {
  id: string;
  booking_number: string;
  farmer_id: string;
  procurement_request_id: string;
  slot_id: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  created_at: string;
  updated_at?: string;
  procurement_requests?: {
    id: string;
    request_number: string;
    estimated_quantity_quintals: number;
    crops?: {
      id: string;
      name: string;
    } | null;
  } | null;
  slots?: {
    id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    centre_id: string;
  } | null;
  procurement_centres?: {
    id: string;
    centre_code: string;
    name: string;
    district: string;
    state: string;
  } | null;
}

export interface CreateBookingResponse {
  success: boolean;
  data: BackendBooking;
  message?: string;
}

export interface RescheduleBookingResponse {
  success: boolean;
  data: BackendBooking;
  message?: string;
}

export interface CancelBookingResponse {
  success: boolean;
  data: {
    message?: string;
    booking?: BackendBooking;
  };
  message?: string;
}

export const bookingApi = {
  async createBooking(
    token: string,
    payload: CreateBookingPayload
  ): Promise<CreateBookingResponse> {
    return apiFetch<CreateBookingResponse>('/api/bookings', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  async rescheduleBooking(
    token: string,
    bookingId: string,
    payload: RescheduleBookingPayload
  ): Promise<RescheduleBookingResponse> {
    return apiFetch<RescheduleBookingResponse>(`/api/bookings/${bookingId}/reschedule`, {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    });
  },

  async cancelBooking(
    token: string,
    bookingId: string
  ): Promise<CancelBookingResponse> {
    return apiFetch<CancelBookingResponse>(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
      token,
    });
  },
};
