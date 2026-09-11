import { apiFetch } from './apiClient';

export type ProcurementStatusBackend =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'VERIFICATION'
  | 'QUALITY_CHECK'
  | 'WEIGHING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PROCUREMENT_COMPLETED';

export interface BackendQualityCheck {
  id: string;
  procurement_record_id: string;
  inspector_id?: string;
  moisture_content_pct: number;
  foreign_matter_pct: number;
  damaged_grains_pct: number;
  status: 'PASSED' | 'FAILED';
  remarks?: string | null;
  checked_at?: string;
}

export interface BackendPayment {
  id: string;
  payment_reference: string;
  procurement_record_id: string;
  farmer_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at?: string;
}

export interface BackendProcurementRecord {
  id: string;
  booking_id: string;
  farmer_id: string;
  centre_id: string;
  crop_id: string;
  status: ProcurementStatusBackend;
  gross_weight_quintals?: number | null;
  tare_weight_quintals?: number | null;
  net_weight_quintals?: number | null;
  rate_per_quintal?: number | null;
  total_amount?: number | null;
  verified_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;

  booking?: {
    id?: string;
    booking_reference?: string;
    procurement_request_id?: string;
  } | null;

  farmer?: {
    user_id?: string;
    farmer_code?: string;
  } | null;

  centre?: {
    id?: string;
    name?: string;
    centre_code?: string;
  } | null;

  crop?: {
    id?: string;
    name?: string;
    crop_code?: string;
    msp_per_quintal?: number;
  } | null;

  quality_check?: BackendQualityCheck | null;
  payment?: BackendPayment | null;
}

export interface GetProcurementResponse {
  success: boolean;
  data: BackendProcurementRecord;
  message?: string;
}

export interface QualityCheckPayload {
  moisture_content_pct: number;
  foreign_matter_pct: number;
  damaged_grains_pct: number;
  remarks?: string | null;
}

export interface SubmitQualityResponse {
  success: boolean;
  message: string;
  data: {
    procurement_record: BackendProcurementRecord;
    quality_check: BackendQualityCheck;
  };
}

export interface WeighingPayload {
  gross_weight_quintals: number;
  tare_weight_quintals: number;
}

export interface SubmitWeighingResponse {
  success: boolean;
  message: string;
  data: BackendProcurementRecord;
}

export interface CompletePayload {
  notes?: string | null;
}

export interface CompleteProcurementResponse {
  success: boolean;
  message: string;
  data: {
    procurement_record: BackendProcurementRecord;
    payment?: BackendPayment | null;
    already_completed?: boolean;
  };
}

export const procurementApi = {
  async getProcurementRecord(
    token: string,
    id: string
  ): Promise<GetProcurementResponse> {
    return apiFetch<GetProcurementResponse>(`/api/procurement/${id}`, {
      method: 'GET',
      token,
    });
  },

  async submitQualityCheck(
    token: string,
    id: string,
    payload: QualityCheckPayload
  ): Promise<SubmitQualityResponse> {
    return apiFetch<SubmitQualityResponse>(`/api/procurement/${id}/quality`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  async submitWeighing(
    token: string,
    id: string,
    payload: WeighingPayload
  ): Promise<SubmitWeighingResponse> {
    return apiFetch<SubmitWeighingResponse>(`/api/procurement/${id}/weigh`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  async completeProcurement(
    token: string,
    id: string,
    payload: CompletePayload = {}
  ): Promise<CompleteProcurementResponse> {
    return apiFetch<CompleteProcurementResponse>(`/api/procurement/${id}/complete`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
};
