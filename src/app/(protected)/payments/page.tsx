"use client";

import { useState, useEffect, useCallback } from "react";
import { paymentService } from "@/services";
import { Pagination, Badge } from "@/components/admin";
import { PaymentConfirmation } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";

export default function WorkerPaymentsPage() {
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      // paymentService.getMyPayments calls /worker/payments
      const res = await paymentService.getMyPayments(page, 10);
      setPayments(res?.data || (Array.isArray(res) ? res : []));
      setTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen bg-gray-50/50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Lịch sử thu nhập</h1>
            <p className="mt-1 text-sm text-gray-500">Xem danh sách các khoản thanh toán bạn đã nhận</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Công việc</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={4} className="px-4 py-4"><div className="h-5 bg-gray-50 rounded animate-pulse w-full max-w-md" /></td></tr>
                    ))
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-400">Bạn chưa có giao dịch thanh toán nào. <Link href="/jobs" className="text-blue-500 hover:underline">Tìm việc ngay</Link></td></tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <Link href={`/jobs/${p.jobId}`} className="hover:text-blue-600 transition-colors">
                            {p.job?.title || "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {p.confirmedByWorker ? (
                            <Badge variant="success">Đã nhận được tiền</Badge>
                          ) : (
                            <Badge variant="warning">Chờ bạn xác nhận</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.type === "FINAL_PAYMENT" ? "Thanh toán cuối" : p.type}</td>
                        <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{formatRelativeTime(p.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {total > 10 && <div className="px-4 py-4 border-t border-gray-200"><Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} /></div>}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
