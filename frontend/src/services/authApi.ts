import { apiFetch } from './apiClient';

export interface BackendUser {
  id: string;
  auth_id?: string;
  full_name: string;
  phone_number: string;
  email: string;
  role: 'FARMER' | 'STAFF' | 'CENTRE_STAFF' | 'SYSTEM_ADMIN' | 'CENTRE_ADMIN';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BackendFarmer {
  id: string;
  user_id: string;
  farmer_code: string;
  land_size_acres?: number | null;
  address_line?: string | null;
  village_or_city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  land_size_acres?: number | null;
  address_line?: string | null;
  village_or_city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: BackendUser;
    farmer: BackendFarmer | null;
  };
}

export interface SendOtpPayload {
  phone: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface AuthResponseData {
  session: AuthSession;
  user: BackendUser;
  farmer: BackendFarmer | null;
}

export interface VerifyOtpResponse {
  success: boolean;
  data: AuthResponseData;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: AuthResponseData;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface MeResponse {
  success: boolean;
  data: {
    user: BackendUser;
    farmer: BackendFarmer | null;
  };
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiFetch<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async sendOtp(phone: string): Promise<SendOtpResponse> {
    return apiFetch<SendOtpResponse>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    return apiFetch<VerifyOtpResponse>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout(token: string): Promise<LogoutResponse> {
    return apiFetch<LogoutResponse>('/api/auth/logout', {
      method: 'POST',
      token,
    });
  },

  async getCurrentUser(token: string): Promise<MeResponse> {
    return apiFetch<MeResponse>('/api/auth/me', {
      method: 'GET',
      token,
    });
  },
};
