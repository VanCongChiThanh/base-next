"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Notification } from "@/types";
import { notificationService } from "@/services";
import { getNotificationRoute } from "@/lib";
import { useAuth } from "./auth-context";
import { NotificationToastContainer } from "@/components/notification-toast";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  handleNotificationClick: (notification: Notification) => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const LIMIT = 20;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchNotifications = useCallback(
    async (pageNum = 1) => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        const response = await notificationService.getAll({
          page: pageNum,
          limit: LIMIT,
        });

        if (pageNum === 1) {
          setNotifications(response.notifications);
        } else {
          setNotifications((prev) => [...prev, ...response.notifications]);
        }

        setUnreadCount(response.unreadCount);
        setTotal(response.pagination?.total || 0);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  const loadMore = useCallback(async () => {
    if (notifications.length < total && !isLoading) {
      await fetchNotifications(page + 1);
    }
  }, [notifications.length, total, isLoading, page, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await notificationService.delete(id);
        const deletedNotification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => prev - 1);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [notifications],
  );

  /**
   * Handle click notification - mark as read và navigate
   */
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark as read nếu chưa đọc
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      // Navigate nếu có route
      const route = getNotificationRoute(notification);
      if (route) {
        router.push(route);
      }
    },
    [markAsRead, router],
  );

  const refresh = useCallback(async () => {
    await fetchNotifications(1);
  }, [fetchNotifications]);

  // SSE: Subscribe realtime notifications
  useEffect(() => {
    if (!isAuthenticated) {
      // Cleanup khi logout
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Lấy token từ localStorage
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Tạo EventSource với token trong query param
    const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        // SSE trả về { data: notification }, cần lấy .data
        const notification: Notification = parsed.data || parsed;
        console.log("SSE notification:", notification);

        if (!notification?.id) {
          console.error("Invalid notification:", notification);
          return;
        }

        // Thêm notification mới vào đầu list
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        setTotal((prev) => prev + 1);
        // Show toast
        setToasts((prev) => [notification, ...prev].slice(0, 5)); // Max 5 toasts
      } catch (error) {
        console.error("Failed to parse SSE notification:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
      // Retry sau 5s
      setTimeout(() => {
        if (isAuthenticated) {
          // Reconnect logic có thể thêm ở đây
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);

  // Fetch notifications khi authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Toast handlers
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleToastClick = useCallback(
    (notification: Notification) => {
      removeToast(notification.id);
      handleNotificationClick(notification);
    },
    [removeToast, handleNotificationClick],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        total,
        isLoading,
        page,
        hasMore: notifications.length < total,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        handleNotificationClick,
        refresh,
      }}
    >
      {children}
      <NotificationToastContainer
        toasts={toasts}
        onClose={removeToast}
        onClick={handleToastClick}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
