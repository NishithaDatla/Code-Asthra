import { apiFetch } from './apiClient';

export interface BackendCrop {
  id: string;
  crop_code?: string;
  name: string;
  category?: string;
  msp_per_quintal?: number;
  is_active?: boolean;
}

export interface ProcurementRequestBackend {
  id: string;
  request_number: string;
  farmer_id: string;
  crop_id: string;
  estimated_quantity_quintals: number;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  crops?: BackendCrop | null;
}

export interface CreateProcurementRequestPayload {
  crop_id: string;
  estimated_quantity_quintals: number;
  notes?: string | null;
}

export interface CreateProcurementRequestResponse {
  success: boolean;
  data: ProcurementRequestBackend;
  message?: string;
}

export interface ListProcurementRequestsResponse {
  success: boolean;
  data: ProcurementRequestBackend[];
  message?: string;
}

export interface GetProcurementRequestResponse {
  success: boolean;
  data: ProcurementRequestBackend;
  message?: string;
}

export const procurementRequestApi = {
  async createRequest(
    token: string,
    payload: CreateProcurementRequestPayload
  ): Promise<CreateProcurementRequestResponse> {
    return apiFetch<CreateProcurementRequestResponse>('/api/procurement-requests', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  async listRequests(token: string): Promise<ListProcurementRequestsResponse> {
    return apiFetch<ListProcurementRequestsResponse>('/api/procurement-requests', {
      method: 'GET',
      token,
    });
  },

  async getRequestById(
    token: string,
    id: string
  ): Promise<GetProcurementRequestResponse> {
    return apiFetch<GetProcurementRequestResponse>(`/api/procurement-requests/${id}`, {
      method: 'GET',
      token,
    });
  },
};
