"use client";

import { useState, useEffect, useCallback } from "react";
import { paymentService } from "@/services";
import { Pagination } from "@/components/admin";
import { ApiError, PaymentConfirmation, Milestone } from "@/types";
import { MilestoneStatus } from "@/types/enums";
import { formatRelativeTime } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import toast from "react-hot-toast";

// ─── Status configs ─────────────────────────────────────────────────────────────

const MILESTONE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDING:   { label: "Chờ bắt đầu",   color: "text-gray-500",   bg: "bg-gray-100",   dot: "bg-gray-400"   },
  IN_PROGRESS: { label: "Đang thực hiện", color: "text-blue-600",  bg: "bg-blue-50",    dot: "bg-blue-500"   },
  SUBMITTED: { label: "Đã nộp bài",    color: "text-indigo-600", bg: "bg-indigo-50",  dot: "bg-indigo-500" },
  APPROVED:  { label: "Đã duyệt",      color: "text-teal-600",   bg: "bg-teal-50",    dot: "bg-teal-500"   },
  RELEASED:  { label: "Đã giải ngân",  color: "text-emerald-600",bg: "bg-emerald-50", dot: "bg-emerald-500"},
  REVISION_REQUESTED: { label: "Cần sửa", color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500" },
};

const P2P_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Chờ xác nhận", color: "text-amber-600",   bg: "bg-amber-50"   },
  CONFIRMED: { label: "Đã xác nhận",  color: "text-emerald-600", bg: "bg-emerald-50" },
  DISPUTED:  { label: "Đang tranh chấp", color: "text-red-600",  bg: "bg-red-50"     },
};

const getPaymentErrorMessage = (err: unknown) => {
  const apiError = err as Partial<ApiError> & {
    response?: { data?: { message?: string } };
  };

  if (apiError.response?.data?.message) return apiError.response.data.message;
  if (typeof apiError.message === "string") return apiError.message;

  return "Có lỗi xảy ra";
};

// ─── Sub-components ──────────────────────────────────────────────────────────────

function MilestoneTable({ milestones, onConfirm, onReport, actionLoading }: {
  milestones: Milestone[];
  onConfirm: (id: string) => void;
  onReport: (id: string) => void;
  actionLoading: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Milestone</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Job</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Số tiền</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Trạng thái</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Thời gian</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {milestones.map((milestone) => {
              const cfg = MILESTONE_STATUS_CONFIG[milestone.status] ?? {
                label: milestone.status,
                color: "text-gray-500",
                bg: "bg-gray-100",
                dot: "bg-gray-400",
              };
              const isReleased = milestone.status === MilestoneStatus.RELEASED;
              const hasConfirmed = !!milestone.workerReceivedAt;

              return (
                <tr key={milestone.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4 align-top">
                    <div className="max-w-[220px]">
                      <p className="font-semibold text-gray-900 text-sm truncate">{milestone.title}</p>
                      {milestone.description && (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-2">{milestone.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    {milestone.escrow?.job ? (
                      <Link
                        href={`/jobs/${milestone.escrow.jobId}`}
                        className="block max-w-[220px] truncate text-sm font-medium text-blue-600 hover:underline"
                      >
                        {milestone.escrow.job.title}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right align-top">
                    <p className="whitespace-nowrap text-sm font-bold text-gray-900">
                      {Number(milestone.amount).toLocaleString("vi-VN")}đ
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                    {isReleased && !hasConfirmed && (
                      <p className="mt-2 max-w-[220px] text-xs font-medium text-amber-600">
                        Admin đã giải ngân, vui lòng xác nhận khi nhận được tiền
                      </p>
                    )}
                    {hasConfirmed && (
                      <p className="mt-2 text-xs font-medium text-emerald-600">
                        Đã nhận {formatRelativeTime(milestone.workerReceivedAt!)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="text-xs text-gray-500">
                      <p>Tạo: {formatRelativeTime(milestone.createdAt)}</p>
                      {milestone.releasedAt && <p className="mt-1">Giải ngân: {formatRelativeTime(milestone.releasedAt)}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right align-top">
                    {isReleased && !hasConfirmed ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onConfirm(milestone.id)}
                          disabled={actionLoading === milestone.id}
                          className="whitespace-nowrap rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {actionLoading === milestone.id ? "Đang xử lý..." : "Xác nhận"}
                        </button>
                        <button
                          onClick={() => onReport(milestone.id)}
                          disabled={actionLoading === "report_" + milestone.id}
                          className="whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {actionLoading === "report_" + milestone.id ? "Đang gửi..." : "Báo cáo"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function P2PPaymentRow({ payment }: { payment: PaymentConfirmation }) {
  const cfg = P2P_STATUS_CONFIG[payment.status] ?? { label: payment.status, color: "text-gray-500", bg: "bg-gray-100" };
  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-1 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <Link href={`/jobs/${payment.jobId}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors truncate block">
          {payment.job?.title ?? "—"}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(payment.createdAt)}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {payment.amount ? (
          <p className="font-bold text-gray-900 text-sm">{Number(payment.amount).toLocaleString("vi-VN")}đ</p>
        ) : null}
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        {payment.confirmedByWorker && (
          <span className="text-emerald-600 text-xs flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Đã xác nhận
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: string; color: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const MILESTONE_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ bắt đầu" },
  { value: "SUBMITTED", label: "Đã nộp bài" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "RELEASED", label: "Đã giải ngân" },
];

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"escrow" | "p2p">("escrow");

  // Escrow milestones
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneTotal, setMilestoneTotal] = useState(0);
  const [milestonePage, setMilestonePage] = useState(1);
  const [milestoneStatus, setMilestoneStatus] = useState("");
  const [milestoneLoading, setMilestoneLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // P2P payments
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Summary stats
  const totalReleased = milestones.filter(m => m.status === "RELEASED").reduce((s, m) => s + Number(m.amount), 0);
  const pendingReceipt = milestones.filter(m => m.status === "RELEASED" && !m.workerReceivedAt).length;

  const fetchMilestones = useCallback(async () => {
    setMilestoneLoading(true);
    try {
      const res = await paymentService.getWorkerMilestones(milestonePage, 10, milestoneStatus || undefined);
      setMilestones(res?.data ?? []);
      setMilestoneTotal(res?.total ?? 0);
    } catch { /* ignore */ }
    finally { setMilestoneLoading(false); }
  }, [milestonePage, milestoneStatus]);

  const fetchPayments = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const res = await paymentService.getMyPayments(paymentPage, 10);
      setPayments(res?.data ?? (Array.isArray(res) ? res : []));
      setPaymentTotal(res?.total ?? 0);
    } catch { /* ignore */ }
    finally { setPaymentLoading(false); }
  }, [paymentPage]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);
  useEffect(() => { if (activeTab === "p2p") fetchPayments(); }, [activeTab, fetchPayments]);

  const handleConfirmReceipt = async (milestoneId: string) => {
    setActionLoading(milestoneId);
    try {
      await paymentService.confirmMilestoneReceipt(milestoneId);
      toast.success("✅ Đã xác nhận nhận tiền thành công!");
      fetchMilestones();
    } catch (err) {
      toast.error(getPaymentErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportNotReceived = async (milestoneId: string) => {
    setActionLoading("report_" + milestoneId);
    try {
      await paymentService.reportMilestoneNotReceived(milestoneId);
      toast("📨 Đã gửi báo cáo đến Admin. Chúng tôi sẽ kiểm tra và liên hệ lại!");
    } catch (err) {
      toast.error(getPaymentErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>💰</span> Quản lý tài chính
            </h1>
            <p className="mt-1 text-sm text-gray-500">Theo dõi toàn bộ khoản thanh toán và thu nhập của bạn</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <SummaryCard
              icon="🏦"
              label="Tổng đã giải ngân (Escrow)"
              value={`${totalReleased.toLocaleString("vi-VN")}đ`}
              sub={`${milestones.filter(m => m.status === "RELEASED").length} milestone`}
              color="bg-emerald-50"
            />
            <SummaryCard
              icon="⏳"
              label="Chờ xác nhận nhận tiền"
              value={`${pendingReceipt} milestone`}
              sub={pendingReceipt > 0 ? "Cần hành động của bạn" : "Tất cả đã xác nhận"}
              color={pendingReceipt > 0 ? "bg-amber-50" : "bg-gray-50"}
            />
            <SummaryCard
              icon="📋"
              label="Tổng milestone"
              value={`${milestoneTotal}`}
              sub="Tất cả các giai đoạn thanh toán"
              color="bg-blue-50"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab("escrow")}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "escrow"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              🔐 Thanh toán Escrow
              {pendingReceipt > 0 && (
                <span className="ml-2 bg-amber-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingReceipt}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("p2p")}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "p2p"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              🤝 Giao dịch trực tiếp
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "escrow" && (
            <div>
              {/* Filter */}
              <div className="flex gap-2 mb-4">
                {MILESTONE_STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setMilestoneStatus(opt.value); setMilestonePage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      milestoneStatus === opt.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {milestoneLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 h-40 animate-pulse">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                      <div className="h-8 bg-gray-100 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : milestones.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-500 text-sm font-medium">Chưa có milestone nào</p>
                  <p className="text-gray-400 text-xs mt-1">Các giai đoạn thanh toán Escrow sẽ xuất hiện ở đây</p>
                  <Link href="/jobs" className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium">
                    Tìm việc ngay →
                  </Link>
                </div>
              ) : (
                <>
                  <MilestoneTable
                    milestones={milestones}
                    onConfirm={handleConfirmReceipt}
                    onReport={handleReportNotReceived}
                    actionLoading={actionLoading}
                  />
                  {milestoneTotal > 10 && (
                    <div className="mt-6">
                      <Pagination
                        page={milestonePage}
                        totalPages={Math.ceil(milestoneTotal / 10)}
                        onPageChange={setMilestonePage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "p2p" && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <h2 className="text-sm font-semibold text-gray-700">Lịch sử giao dịch trực tiếp (P2P)</h2>
                <p className="text-xs text-gray-400 mt-0.5">Các khoản thanh toán qua giao dịch mặt đối mặt</p>
              </div>
              <div className="px-5 divide-y divide-gray-100">
                {paymentLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="py-4 flex items-center gap-3">
                      <div className="h-4 bg-gray-100 rounded flex-1 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                    </div>
                  ))
                ) : payments.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-4xl mb-3">🤝</p>
                    <p className="text-gray-500 text-sm font-medium">Chưa có giao dịch nào</p>
                    <Link href="/jobs" className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium">
                      Tìm việc ngay →
                    </Link>
                  </div>
                ) : (
                  payments.map(p => <P2PPaymentRow key={p.id} payment={p} />)
                )}
              </div>
              {paymentTotal > 10 && (
                <div className="px-5 py-4 border-t border-gray-100">
                  <Pagination page={paymentPage} totalPages={Math.ceil(paymentTotal / 10)} onPageChange={setPaymentPage} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
