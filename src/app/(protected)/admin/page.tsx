"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { StatsCard } from "@/components/admin";
import { adminService, DashboardStats } from "@/services/admin.service";
import { syncJobsToVectorDb } from "@/services/ai.service";
import { notificationService } from "@/services/notification.service";
import { formatRelativeTime } from "@/lib/utils";
import { getNotificationTitle, getNotificationMessage } from "@/lib/notification.utils";
import { Notification } from "@/types";

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats().catch(() => null),
      notificationService.getAll({ page: 1, limit: 3 }).catch(() => null),
    ])
      .then(([statsRes, notifRes]) => {
        if (statsRes) setStats(statsRes);
        if (notifRes) setNotifications(notifRes.notifications);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const o = stats?.overview;

  const handleSyncAI = async () => {
    setIsSyncing(true);
    try {
      const res = await syncJobsToVectorDb();
      toast.success(res?.message || "Đã yêu cầu đồng bộ.");
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi đồng bộ dữ liệu AI.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Thống kê tổng hợp hệ thống
          </p>
        </div>
        <button
          onClick={handleSyncAI}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-50 transition-all"
        >
          {isSyncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang đồng bộ...
            </>
          ) : (
            <>
              <span>🤖</span>
              Đồng bộ AI Vector
            </>
          )}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Người dùng"
          value={isLoading ? "..." : o?.totalUsers ?? 0}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>}
        />
        <StatsCard
          title="Tổng việc làm"
          value={isLoading ? "..." : o?.totalJobs ?? 0}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>}
        />
        <StatsCard
          title="Hoàn thành"
          value={isLoading ? "..." : o?.totalCompletedJobs ?? 0}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
        />
        <StatsCard
          title="Đánh giá"
          value={isLoading ? "..." : o?.totalReviews ?? 0}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>}
        />
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/disputes" className="block p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Tranh chấp mở</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{isLoading ? "..." : o?.openDisputes ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            </div>
          </div>
        </Link>
        <Link href="/admin/reports" className="block p-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-800">Báo cáo chờ xử lý</p>
              <p className="text-2xl font-bold text-rose-900 mt-1">{isLoading ? "..." : o?.pendingReports ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Jobs by status */}
      {stats?.jobsByStatus && stats.jobsByStatus.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Việc làm theo trạng thái</h2>
          <div className="flex flex-wrap gap-3">
            {stats.jobsByStatus.map((item) => (
              <div key={item.status} className={`px-4 py-2 rounded-lg ${statusColors[item.status] || "bg-gray-100 text-gray-700"}`}>
                <span className="text-sm font-medium">{item.status}</span>
                <span className="ml-2 text-lg font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Việc làm mới nhất</h2>
            <Link href="/admin/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Xem tất cả →</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {stats?.recentJobs?.map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.employer?.firstName} {job.employer?.lastName} · {formatRelativeTime(job.createdAt)}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[job.status] || "bg-gray-100 text-gray-700"}`}>{job.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Người dùng mới</h2>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Xem tất cả →</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {stats?.recentUsers?.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{user.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Thông báo mới nhất</h2>
          <Link href="/admin/notifications" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Xem tất cả →</Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className={`flex items-start gap-4 py-3 px-4 rounded-xl border ${notif.isRead ? 'border-gray-100 bg-white' : 'border-indigo-100 bg-indigo-50/50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.isRead ? 'bg-gray-100' : 'bg-indigo-100'}`}>
                  {notif.type === 'SYSTEM' ? (
                    <span>🤖</span>
                  ) : (
                    <span>🔔</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold truncate ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{getNotificationTitle(notif)}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{getNotificationMessage(notif)}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(notif.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500 text-sm">
            Không có thông báo nào.
          </div>
        )}
      </div>
    </div>
  );
}
