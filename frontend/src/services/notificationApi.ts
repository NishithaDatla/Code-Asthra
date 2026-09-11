import { apiFetch } from './apiClient';

export type NotificationTypeBackend =
  | 'BOOKING_CONFIRMED'
  | 'SLOT_REMINDER'
  | 'QUEUE_CALLED'
  | 'PROCUREMENT_UPDATED'
  | 'PAYMENT_PROCESSED'
  | 'SYSTEM_ALERT';

export interface BackendNotification {
  id: string;
  type: NotificationTypeBackend;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: BackendNotification[];
  message?: string;
}

export interface MarkNotificationReadResponse {
  success: boolean;
  data: BackendNotification;
  message?: string;
}

export const notificationApi = {
  async getNotifications(token: string): Promise<GetNotificationsResponse> {
    return apiFetch<GetNotificationsResponse>('/api/notifications', {
      method: 'GET',
      token,
    });
  },

  async markNotificationRead(
    token: string,
    id: string
  ): Promise<MarkNotificationReadResponse> {
    return apiFetch<MarkNotificationReadResponse>(`/api/notifications/${id}/read`, {
      method: 'PUT',
      token,
    });
  },
};
