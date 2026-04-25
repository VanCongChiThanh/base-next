"use client";

import { useNotifications } from "@/contexts";
import {
  getNotificationColor,
  getNotificationTitle,
  getNotificationMessage,
  getNotificationIcon,
  getNotificationRoute,
} from "@/lib/notification.utils";
import { NotificationType } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

function getTypeStyle(type: NotificationType): string {
  const color = getNotificationColor(type);
  switch (color) {
    case "success":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "error":
      return "bg-red-100 text-red-800 border-red-200";
    case "warning":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "info":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
  }
}

function getIconSvg(iconName: string) {
  switch (iconName) {
    case "check-circle":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "x-circle":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
}

export default function AdminNotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAllAsRead,
    refresh,
  } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">
            Xem nhật ký thông báo dành cho quản trị viên
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-xl shadow-sm transition-all"
          >
            Làm mới
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">
          {isLoading && notifications.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Bạn chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const iconName = getNotificationIcon(notification.type);
                const colorClass = getTypeStyle(notification.type);
                const route = getNotificationRoute(notification);

                return (
                  <div
                    key={notification.id}
                    className={`relative rounded-xl border p-4 sm:p-5 transition-all ${
                      !notification.isRead ? "border-indigo-200 bg-indigo-50/50" : "border-gray-100 bg-white"
                    }`}
                  >
                    {!notification.isRead && (
                      <div className="absolute top-5 right-5 w-2 h-2 bg-indigo-500 rounded-full"></div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2.5 rounded-xl border flex-shrink-0 ${colorClass}`}>
                        {getIconSvg(iconName)}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className={`font-semibold text-sm sm:text-base mb-1 truncate ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                          {getNotificationTitle(notification)}
                        </h3>
                        <p className={`text-sm ${!notification.isRead ? "text-gray-800" : "text-gray-600"}`}>
                          {getNotificationMessage(notification)}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <p className="text-xs text-gray-400 font-medium">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                          {route && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <Link href={route} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center group">
                                Xem chi tiết
                                <svg className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && notifications.length > 0 && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50"
              >
                {isLoading ? "Đang tải..." : "Tải thêm thông báo"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
