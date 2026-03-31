"use client";

import { useEffect, useState } from "react";
import { Notification, NotificationType } from "@/types";
import { getNotificationTitle, getNotificationMessage } from "@/lib";

interface ToastProps {
  notification: Notification;
  onClose: () => void;
  onClick: () => void;
}

function Toast({ notification, onClose, onClick }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Auto dismiss sau 5s
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300); // Wait for animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  // Color based on notification type
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.ORDER_DELIVERED:
        return "border-l-green-500 bg-green-50";
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.ORDER_CANCELLED:
        return "border-l-red-500 bg-red-50";
      case NotificationType.ORDER_SHIPPED:
        return "border-l-yellow-500 bg-yellow-50";
      case NotificationType.PROMOTION:
        return "border-l-purple-500 bg-purple-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  // Icon based on notification type
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.ORDER_DELIVERED:
        return (
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.ORDER_CANCELLED:
        return (
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case NotificationType.USER_FOLLOWED:
        return (
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
      case NotificationType.POST_LIKED:
        return (
          <svg
            className="w-5 h-5 text-pink-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 cursor-pointer
        transform transition-all duration-300 ease-out
        hover:shadow-xl hover:scale-[1.02]
        ${getTypeColor(notification.type)}
        ${isLeaving ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getTypeIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          {getNotificationTitle(notification)}
        </p>
        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
          {getNotificationMessage(notification)}
        </p>
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

interface NotificationToastContainerProps {
  toasts: Notification[];
  onClose: (id: string) => void;
  onClick: (notification: Notification) => void;
}

export function NotificationToastContainer({
  toasts,
  onClose,
  onClick,
}: NotificationToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((notification, index) => (
        <Toast
          key={notification.id || `toast-${index}`}
          notification={notification}
          onClose={() => onClose(notification.id)}
          onClick={() => onClick(notification)}
        />
      ))}
    </div>
  );
}
