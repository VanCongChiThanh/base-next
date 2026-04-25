"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService, Report } from "@/services/admin.service";
import { SelectFilter, Pagination, Badge, Modal } from "@/components/admin";
import { formatRelativeTime } from "@/lib/utils";

const statusOptions = [
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đã xem", value: "REVIEWED" },
  { label: "Đã xử lý", value: "RESOLVED" },
  { label: "Từ chối", value: "DISMISSED" },
];

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  PENDING: { label: "Chờ xử lý", variant: "warning" },
  REVIEWED: { label: "Đã xem", variant: "default" },
  RESOLVED: { label: "Đã xử lý", variant: "success" },
  DISMISSED: { label: "Từ chối", variant: "danger" },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReports({ page, limit: 10, status: status || undefined });
      setReports(res?.data || (Array.isArray(res) ? res : []));
      setTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpdate = async () => {
    if (!selectedReport || !updateStatus) return;
    setUpdating(true);
    try {
      await adminService.updateReport(selectedReport.id, { status: updateStatus, adminNote: adminNote || undefined });
      setSelectedReport(null);
      fetchReports();
    } catch { /* ignore */ }
    finally { setUpdating(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý báo cáo</h1>
        <p className="mt-1 text-sm text-gray-500">Xem xét và xử lý các báo cáo vi phạm</p>
      </div>

      <div className="flex gap-3">
        <SelectFilter value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={statusOptions} placeholder="Tất cả trạng thái" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Người báo cáo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bị báo cáo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lý do</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Công việc</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-gray-50 rounded animate-pulse" /></td></tr>
                ))
              ) : reports.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Không có báo cáo nào</td></tr>
              ) : (
                reports.map((report) => {
                  const badge = statusBadge[report.status] || { label: report.status, variant: "default" as const };
                  return (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900">{report.reporter?.firstName} {report.reporter?.lastName}</td>
                      <td className="px-4 py-3 text-gray-900">{report.reportedUser?.firstName} {report.reportedUser?.lastName}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{report.reason}</td>
                      <td className="px-4 py-3 text-gray-600">{report.job?.title || "—"}</td>
                      <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatRelativeTime(report.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedReport(report); setUpdateStatus(report.status); setAdminNote(report.adminNote || ""); }}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >Xem xét</button>
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

      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Chi tiết báo cáo">
        {selectedReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Người báo cáo:</span> <span className="font-medium text-gray-900">{selectedReport.reporter?.firstName} {selectedReport.reporter?.lastName}</span></div>
              <div><span className="text-gray-500">Bị báo cáo:</span> <span className="font-medium text-gray-900">{selectedReport.reportedUser?.firstName} {selectedReport.reportedUser?.lastName}</span></div>
            </div>
            <div><span className="text-sm text-gray-500">Lý do:</span><p className="mt-1 text-sm text-gray-900">{selectedReport.reason}</p></div>
            {selectedReport.description && (<div><span className="text-sm text-gray-500">Mô tả chi tiết:</span><p className="mt-1 text-sm text-gray-900">{selectedReport.description}</p></div>)}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cập nhật trạng thái</label>
              <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent">
                <option value="PENDING">Chờ xử lý</option>
                <option value="REVIEWED">Đã xem</option>
                <option value="RESOLVED">Đã xử lý</option>
                <option value="DISMISSED">Từ chối</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú admin</label>
              <textarea rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none" placeholder="Ghi chú xử lý..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Huỷ</button>
              <button onClick={handleUpdate} disabled={updating} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{updating ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
