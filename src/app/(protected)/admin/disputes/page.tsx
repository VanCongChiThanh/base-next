"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { SelectFilter, Pagination, Badge, Modal } from "@/components/admin";
import { Dispute } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

const statusOptions = [
  { label: "Đang mở", value: "OPEN" },
  { label: "Đang xem xét", value: "UNDER_REVIEW" },
  { label: "Đã xử lý", value: "RESOLVED" },
  { label: "Từ chối", value: "DISMISSED" },
];

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  OPEN: { label: "Đang mở", variant: "warning" },
  UNDER_REVIEW: { label: "Đang xem xét", variant: "default" },
  RESOLVED: { label: "Đã xử lý", variant: "success" },
  DISMISSED: { label: "Từ chối", variant: "danger" },
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getDisputes({ page, limit: 10, status: status || undefined });
      setDisputes(res?.data || (Array.isArray(res) ? res : []));
      setTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleAction = async (action: "resolve" | "dismiss") => {
    if (!selected || !resolution.trim()) return;
    setProcessing(true);
    try {
      if (action === "resolve") await adminService.resolveDispute(selected.id, resolution);
      else await adminService.dismissDispute(selected.id, resolution);
      setSelected(null);
      setResolution("");
      fetchDisputes();
    } catch { /* ignore */ }
    finally { setProcessing(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tranh chấp</h1>
        <p className="mt-1 text-sm text-gray-500">Xem xét và giải quyết các tranh chấp thanh toán</p>
      </div>

      <div className="flex gap-3">
        <SelectFilter value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={statusOptions} placeholder="Tất cả trạng thái" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Công việc</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Người tạo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lý do</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-gray-50 rounded animate-pulse" /></td></tr>
                ))
              ) : disputes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Không có tranh chấp nào</td></tr>
              ) : (
                disputes.map((d) => {
                  const badge = statusBadge[d.status] || { label: d.status, variant: "default" as const };
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{d.job?.title || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.raisedBy?.firstName} {d.raisedBy?.lastName}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[250px] truncate">{d.reason}</td>
                      <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatRelativeTime(d.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {(d.status === "OPEN" || d.status === "UNDER_REVIEW") ? (
                          <button onClick={() => { setSelected(d); setResolution(""); }} className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">Xử lý</button>
                        ) : (
                          <span className="text-xs text-gray-400">{d.resolution ? "Đã xử lý" : "—"}</span>
                        )}
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

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Xử lý tranh chấp">
        {selected && (
          <div className="space-y-4">
            <div className="text-sm">
              <p><span className="text-gray-500">Công việc:</span> <span className="font-medium text-gray-900">{selected.job?.title}</span></p>
              <p className="mt-1"><span className="text-gray-500">Người tạo:</span> <span className="font-medium text-gray-900">{selected.raisedBy?.firstName} {selected.raisedBy?.lastName}</span></p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">Lý do tranh chấp</p>
              <p className="mt-1 text-sm text-amber-900">{selected.reason}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung giải quyết <span className="text-red-500">*</span></label>
              <textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none" placeholder="Mô tả cách giải quyết tranh chấp..." />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Huỷ</button>
              <button onClick={() => handleAction("dismiss")} disabled={processing || !resolution.trim()} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">Từ chối</button>
              <button onClick={() => handleAction("resolve")} disabled={processing || !resolution.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{processing ? "Đang xử lý..." : "Giải quyết"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
