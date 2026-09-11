import { apiFetch } from './apiClient';

export interface RecommendationPayload {
  procurement_request_id: string;
  preferred_date?: string;
}

export interface RecommendationCentre {
  id: string;
  centre_code: string;
  name: string;
  district: string;
  state: string;
  congestion_level: string;
}

export interface RecommendationSlot {
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
}

export interface RecommendationMatchFactors {
  district_match: boolean;
  capacity_fit: boolean;
  congestion: string;
}

export interface RecommendationItem {
  rank: number;
  score: number;
  centre: RecommendationCentre;
  slot: RecommendationSlot;
  match_factors: RecommendationMatchFactors;
  reasons: string[];
}

export interface ProcurementRequestSummary {
  id: string;
  request_number: string;
  crop_name: string;
  estimated_quantity_quintals: number;
}

export interface RecommendationData {
  procurement_request: ProcurementRequestSummary;
  preferred_date: string;
  recommendations: RecommendationItem[];
  message?: string;
}

export interface RecommendationResponse {
  success: boolean;
  data: RecommendationData;
  message?: string;
}

export const schedulingApi = {
  async recommendSlots(
    token: string,
    payload: RecommendationPayload
  ): Promise<RecommendationResponse> {
    return apiFetch<RecommendationResponse>('/api/scheduling/recommend', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
};
