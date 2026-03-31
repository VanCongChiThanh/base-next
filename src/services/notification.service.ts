import apiClient from "@/lib/api-client";
import {
  Notification,
  PaginationParams,
  PaginationMeta,
  ApiSuccessResponse,
} from "@/types";

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: PaginationMeta;
  unreadCount: number;
}

export const notificationService = {
  /**
   * Get all notifications with pagination
   */
  async getAll(
    params: PaginationParams = {},
  ): Promise<NotificationListResponse> {
    const { page = 1, limit = 20 } = params;
    const response = await apiClient.getFull<Notification[]>(
      `/notifications?page=${page}&limit=${limit}`,
    );

    return {
      notifications: response.data,
      pagination: response.meta?.pagination as PaginationMeta,
      unreadCount: (response.meta?.unreadCount as number) || 0,
    };
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patchFull("/notifications/read-all");
  },

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    await apiClient.deleteFull(`/notifications/${id}`);
  },
};

export default notificationService;
