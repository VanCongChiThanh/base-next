"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { SelectFilter, Pagination, Badge } from "@/components/admin";
import { PaymentConfirmation } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

const statusOptions = [
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đã xác nhận", value: "PAYMENT_CONFIRMED" },
  { label: "Tranh chấp", value: "DISPUTED" },
];

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  PENDING: { label: "Chờ xử lý", variant: "warning" },
  PAYMENT_CONFIRMED: { label: "Đã xác nhận", variant: "success" },
  DISPUTED: { label: "Tranh chấp", variant: "danger" },
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPayments({ page, limit: 10, status: status || undefined });
      setPayments(res?.data || (Array.isArray(res) ? res : []));
      setTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý thanh toán</h1>
        <p className="mt-1 text-sm text-gray-500">Xem lịch sử thanh toán trên hệ thống</p>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Người lao động</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Worker xác nhận</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ghi chú</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-gray-50 rounded animate-pulse" /></td></tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Không có thanh toán nào</td></tr>
              ) : (
                payments.map((p) => {
                  const badge = statusBadge[p.status] || { label: p.status, variant: "default" as const };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{p.job?.title || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.worker?.firstName} {p.worker?.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{p.type === "FINAL_PAYMENT" ? "Thanh toán cuối" : p.type}</td>
                      <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="px-4 py-3">{p.confirmedByWorker ? <span className="text-emerald-600 font-medium">✓ Đã xác nhận</span> : <span className="text-gray-400">Chưa</span>}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{p.note || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatRelativeTime(p.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > 10 && <div className="px-4 py-3 border-t border-gray-200"><Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} /></div>}
      </div>
    </div>
  );
}
