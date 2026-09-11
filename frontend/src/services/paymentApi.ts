import { apiFetch } from './apiClient';

export type PaymentStatusBackend = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BackendPayment {
  id: string;
  payment_reference: string;
  procurement_record_id: string;
  farmer_id: string;
  amount: number;
  status: PaymentStatusBackend;
  payment_method: string;
  dbt_reference?: string | null;
  transaction_id?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GetPaymentResponse {
  success: boolean;
  data: BackendPayment;
  message?: string;
}

export interface UpdatePaymentStatusPayload {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transaction_id?: string | null;
}

export interface UpdatePaymentStatusResponse {
  success: boolean;
  message: string;
  data: BackendPayment;
}

export const paymentApi = {
  async getPaymentByProcurementId(
    token: string,
    procurementId: string
  ): Promise<GetPaymentResponse> {
    return apiFetch<GetPaymentResponse>(`/api/payments/${procurementId}`, {
      method: 'GET',
      token,
    });
  },

  async updatePaymentStatus(
    token: string,
    id: string,
    payload: UpdatePaymentStatusPayload
  ): Promise<UpdatePaymentStatusResponse> {
    return apiFetch<UpdatePaymentStatusResponse>(`/api/payments/${id}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    });
  },
};
