"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { SearchInput, SelectFilter, Pagination, Badge, ConfirmDialog } from "@/components/admin";
import { Job } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

const statusOptions = [
  { label: "Đang mở", value: "OPEN" },
  { label: "Đã đóng", value: "CLOSED" },
  { label: "Đã huỷ", value: "CANCELLED" },
];

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  OPEN: { label: "Đang mở", variant: "success" },
  CLOSED: { label: "Đã đóng", variant: "default" },
  CANCELLED: { label: "Đã huỷ", variant: "danger" },
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "close" | "delete" } | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getJobs({ page, limit: 10, status: status || undefined, search: search || undefined });
      setJobs(res?.data || (Array.isArray(res) ? res : []));
      setTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchJobs(); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.action === "close") await adminService.closeJob(confirmAction.id);
      else await adminService.deleteJob(confirmAction.id);
      fetchJobs();
    } catch { /* ignore */ }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý việc làm</h1>
        <p className="mt-1 text-sm text-gray-500">Xem, tìm kiếm và quản lý tất cả công việc</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tiêu đề..." /></div>
        <SelectFilter value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={statusOptions} placeholder="Tất cả trạng thái" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tiêu đề</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Người đăng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Danh mục</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lương</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày đăng</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-gray-50 rounded animate-pulse" /></td></tr>
                ))
              ) : jobs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Không có công việc nào</td></tr>
              ) : (
                jobs.map((job) => {
                  const badge = statusBadge[job.status] || { label: job.status, variant: "default" as const };
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{job.title}</td>
                      <td className="px-4 py-3 text-gray-600">{job.employer?.firstName} {job.employer?.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{job.category?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{Number(job.salaryPerHour).toLocaleString("vi-VN")}đ/h</td>
                      <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatRelativeTime(job.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {job.status === "OPEN" && (
                            <button onClick={() => setConfirmAction({ id: job.id, action: "close" })} className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">Đóng</button>
                          )}
                          <button onClick={() => setConfirmAction({ id: job.id, action: "delete" })} className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Xoá</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > 10 && <div className="px-4 py-3 border-t border-gray-200"><Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} /></div>}
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title={confirmAction?.action === "close" ? "Đóng công việc" : "Xoá công việc"}
        message={confirmAction?.action === "close" ? "Bạn có chắc muốn đóng công việc này?" : "Bạn có chắc muốn xoá công việc này? Hành động không thể hoàn tác."}
        confirmText={confirmAction?.action === "close" ? "Đóng" : "Xoá"}
        variant={confirmAction?.action === "delete" ? "danger" : "warning"}
      />
    </div>
  );
}
