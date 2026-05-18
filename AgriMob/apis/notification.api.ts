import { apiFetch } from "./api";

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  getNotifications: () => apiFetch<Notification[]>("/api/notifications/"),
  getUnreadCount: () => apiFetch<{ unread_count: number }>("/api/notifications/unread-count/"),
  markAllRead: () => apiFetch<{ status: string }>("/api/notifications/read-all/", { method: "PATCH" }),
  markRead: (id: number) => apiFetch<{ status: string }>(`/api/notifications/${id}/read/`, { method: "PATCH" }),
};
