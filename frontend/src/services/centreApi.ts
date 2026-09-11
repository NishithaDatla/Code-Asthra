import { apiFetch } from './apiClient';

export interface BackendCentre {
  id: string;
  centre_code: string;
  name: string;
  address_line?: string | null;
  district: string;
  state: string;
  pincode?: string | null;
  daily_capacity_quintals?: number | null;
  total_counters?: number | null;
  status: 'OPEN' | 'CLOSED' | 'PAUSED';
  created_at?: string;
  updated_at?: string;
}

export interface BackendCounter {
  id: string;
  counter_number: number;
  counter_name: string;
  is_active: boolean;
}

export interface BackendCentreMetric {
  id: string;
  recorded_at: string;
  waiting_count: number;
  avg_wait_time_minutes: number;
  avg_processing_time_minutes: number;
  congestion_level: 'LOW' | 'MEDIUM' | 'HIGH';
  today_total_procured_quintals: number;
}

export interface BackendCentreDetail extends BackendCentre {
  counters?: BackendCounter[];
  latest_metric?: BackendCentreMetric | null;
}

export interface BackendSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_capacity_quintals: number;
  booked_capacity_quintals: number;
  available_capacity_quintals: number;
  max_farmers: number;
  booked_farmers: number;
  available_farmer_slots: number;
  is_fully_booked: boolean;
  is_active: boolean;
}

export interface BackendCentreAvailability {
  centre: {
    id: string;
    centre_code: string;
    name: string;
    status: string;
    daily_capacity_quintals: number;
  };
  date: string;
  total_slots: number;
  slots: BackendSlot[];
}

export interface ListCentresFilter {
  district?: string;
  state?: string;
  status?: 'OPEN' | 'CLOSED' | 'PAUSED';
}

export interface ListCentresResponse {
  success: boolean;
  data: BackendCentre[];
  message?: string;
}

export interface GetCentreDetailResponse {
  success: boolean;
  data: BackendCentreDetail;
  message?: string;
}

export interface GetCentreAvailabilityResponse {
  success: boolean;
  data: BackendCentreAvailability;
  message?: string;
}

export const centreApi = {
  async getCentres(
    token?: string | null,
    filters: ListCentresFilter = {}
  ): Promise<ListCentresResponse> {
    const params = new URLSearchParams();
    if (filters.district && filters.district !== 'ALL') {
      params.append('district', filters.district);
    }
    if (filters.state && filters.state !== 'ALL') {
      params.append('state', filters.state);
    }
    if (filters.status && (filters.status as string) !== 'ALL') {
      params.append('status', filters.status);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<ListCentresResponse>(`/api/centres${queryStr}`, {
      method: 'GET',
      token,
    });
  },

  async getCentreById(
    token: string | null | undefined,
    id: string
  ): Promise<GetCentreDetailResponse> {
    return apiFetch<GetCentreDetailResponse>(`/api/centres/${id}`, {
      method: 'GET',
      token,
    });
  },

  async getCentreAvailability(
    token: string | null | undefined,
    id: string,
    date?: string
  ): Promise<GetCentreAvailabilityResponse> {
    const queryStr = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiFetch<GetCentreAvailabilityResponse>(`/api/centres/${id}/availability${queryStr}`, {
      method: 'GET',
      token,
    });
  },
};
