"use client";

import { useNotifications } from "@/contexts";
import { AuthGuard } from "@/components/auth-guard";
import { NotificationType } from "@/types";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  getNotificationColor,
  getNotificationRoute,
  getNotificationTitle,
  getNotificationMessage,
  getNotificationIcon,
} from "@/lib/notification.utils";
import { formatRelativeTime } from "@/lib/utils";

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
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getIconSvg(iconName: string) {
  switch (iconName) {
    case "package":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
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
    case "user-plus":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case "heart":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "message-circle":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "gift":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
      );
    case "bell":
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
}

function NotificationsContent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAllAsRead,
    handleNotificationClick,
    refresh,
  } = useNotifications();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Thông báo</h1>
            {unreadCount > 0 && (
              <p className="text-blue-600 font-medium mt-1">
                Bạn có {unreadCount} thông báo chưa đọc
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
            >
              Làm mới
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        {isLoading && notifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Bạn chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const iconName = getNotificationIcon(notification.type);
              const colorClass = getTypeStyle(notification.type);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative bg-white rounded-2xl border p-4 sm:p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group ${
                    !notification.isRead ? "border-blue-200 shadow-sm bg-blue-50/30" : "border-gray-100"
                  }`}
                >
                  {!notification.isRead && (
                    <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-blue-50"></div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2.5 rounded-xl border flex-shrink-0 ${colorClass}`}>
                      {getIconSvg(iconName)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className={`font-semibold text-base mb-1 truncate ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {getNotificationTitle(notification)}
                      </h3>
                      <p className={`text-sm line-clamp-2 ${!notification.isRead ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                        {getNotificationMessage(notification)}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <p className="text-xs text-gray-400 font-medium">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                        {getNotificationRoute(notification) && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 flex items-center">
                              Xem chi tiết
                              <svg className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="text-center pt-6 pb-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100 disabled:opacity-50"
                >
                  {isLoading ? "Đang tải..." : "Tải thêm thông báo"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
