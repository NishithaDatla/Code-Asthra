import { apiFetch } from './apiClient';
import type { BackendUser, BackendFarmer } from './authApi';

export interface UpdateFarmerProfilePayload {
  full_name?: string;
  phone_number?: string;
  land_size_acres?: number | null;
  address_line?: string | null;
  village_or_city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
}

export interface FarmerProfileData {
  user: BackendUser;
  farmer: BackendFarmer | null;
}

export interface FarmerProfileResponse {
  success: boolean;
  data: FarmerProfileData;
  message?: string;
}

export const farmerApi = {
  async getProfile(token: string): Promise<FarmerProfileResponse> {
    return apiFetch<FarmerProfileResponse>('/api/farmer/profile', {
      method: 'GET',
      token,
    });
  },

  async updateProfile(
    token: string,
    payload: UpdateFarmerProfilePayload
  ): Promise<FarmerProfileResponse> {
    return apiFetch<FarmerProfileResponse>('/api/farmer/profile', {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    });
  },
};
