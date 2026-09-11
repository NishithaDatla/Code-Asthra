const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[] | string>;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[] | string>;

  constructor(message: string, status: number, errors?: Record<string, string[] | string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers: customHeaders, ...restOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.message ||
        (data.errors
          ? Object.values(data.errors).flat().join(', ')
          : `Request failed with status ${response.status}`);

      throw new ApiError(errorMessage, response.status, data.errors);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error) {
      throw new ApiError(err.message || 'Network request failed', 0);
    }
    throw new ApiError('An unexpected error occurred', 0);
  }
}
