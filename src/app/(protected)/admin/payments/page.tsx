"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { SelectFilter, Pagination, Badge } from "@/components/admin";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { PaymentConfirmation, Milestone, BankAccount } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

const paymentStatusOptions = [
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đã xác nhận", value: "PAYMENT_CONFIRMED" },
  { label: "Tranh chấp", value: "DISPUTED" },
];

const milestoneStatusOptions = [
  { label: "Chờ giải ngân", value: "APPROVED" },
  { label: "Đã giải ngân", value: "RELEASED" },
  { label: "Đã nộp bài", value: "SUBMITTED" },
  { label: "Đang tiến hành", value: "IN_PROGRESS" },
  { label: "Yêu cầu sửa", value: "REVISION_REQUESTED" },
];

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  PENDING: { label: "Chờ xử lý", variant: "warning" },
  PAYMENT_CONFIRMED: { label: "Đã xác nhận", variant: "success" },
  DISPUTED: { label: "Tranh chấp", variant: "danger" },
  APPROVED: { label: "Chờ giải ngân", variant: "warning" },
  RELEASED: { label: "Đã giải ngân", variant: "success" },
  SUBMITTED: { label: "Đã nộp bài", variant: "warning" },
  IN_PROGRESS: { label: "Đang thực hiện", variant: "default" },
  REVISION_REQUESTED: { label: "Yêu cầu sửa", variant: "danger" },
};

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"offline" | "milestone" | "refund">("offline");

  // State for offline payments
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(true);

  // State for milestones
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneTotal, setMilestoneTotal] = useState(0);
  const [milestonePage, setMilestonePage] = useState(1);
  const [milestoneStatus, setMilestoneStatus] = useState("APPROVED");
  const [milestoneLoading, setMilestoneLoading] = useState(true);

  // State for escrows (refund)
  const [escrows, setEscrows] = useState<any[]>([]);
  const [escrowTotal, setEscrowTotal] = useState(0);
  const [escrowPage, setEscrowPage] = useState(1);
  const [escrowStatus, setEscrowStatus] = useState("REFUND_PENDING");
  const [escrowLoading, setEscrowLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; milestoneId: string | null }>({ isOpen: false, milestoneId: null });
  const [refundConfirmModal, setRefundConfirmModal] = useState<{ isOpen: boolean; escrowId: string | null }>({ isOpen: false, escrowId: null });
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: "" });
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const fetchPayments = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const res = await adminService.getPayments({ page: paymentPage, limit: 10, status: paymentStatus || undefined });
      setPayments(res?.data || (Array.isArray(res) ? res : []));
      setPaymentTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setPaymentLoading(false); }
  }, [paymentPage, paymentStatus]);

  const fetchMilestones = useCallback(async () => {
    setMilestoneLoading(true);
    try {
      const res = await adminService.getAdminMilestones({ page: milestonePage, limit: 10, status: milestoneStatus || undefined });
      setMilestones(res?.data || []);
      setMilestoneTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setMilestoneLoading(false); }
  }, [milestonePage, milestoneStatus]);

  const fetchEscrows = useCallback(async () => {
    setEscrowLoading(true);
    try {
      const res = await adminService.getAdminEscrows({ page: escrowPage, limit: 10, status: escrowStatus || undefined });
      setEscrows(res?.data || []);
      setEscrowTotal(res?.total || 0);
    } catch { /* ignore */ }
    finally { setEscrowLoading(false); }
  }, [escrowPage, escrowStatus]);

  useEffect(() => {
    if (activeTab === "offline") {
      fetchPayments();
    } else if (activeTab === "milestone") {
      fetchMilestones();
    } else {
      fetchEscrows();
    }
  }, [activeTab, fetchPayments, fetchMilestones, fetchEscrows]);

  const openConfirmModal = (id: string) => {
    setConfirmModal({ isOpen: true, milestoneId: id });
  };

  const handleReleaseMilestone = async () => {
    if (!confirmModal.milestoneId) return;
    setIsReleasing(true);
    try {
      await adminService.releaseMilestonePayment(confirmModal.milestoneId, "Admin đã giải ngân");
      toast.success("Giải ngân thành công");
      fetchMilestones();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Lỗi khi giải ngân";
      toast.error(message);
    } finally {
      setIsReleasing(false);
      setConfirmModal({ isOpen: false, milestoneId: null });
    }
  };

  const handleRefundEscrow = async () => {
    if (!refundConfirmModal.escrowId) return;
    setIsRefunding(true);
    try {
      await adminService.refundEscrow(refundConfirmModal.escrowId, "Admin đã hoàn tiền");
      toast.success("Hoàn tiền thành công");
      fetchEscrows();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi hoàn tiền");
    } finally {
      setIsRefunding(false);
      setRefundConfirmModal({ isOpen: false, escrowId: null });
    }
  };

  const renderOfflinePayments = () => (
    <>
      <div className="flex gap-3 mb-4">
        <SelectFilter value={paymentStatus} onChange={(v) => { setPaymentStatus(v); setPaymentPage(1); }} options={paymentStatusOptions} placeholder="Tất cả trạng thái" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Công việc</th>
                <th className="hidden md:table-cell text-left px-4 py-3 font-medium text-gray-600">Người lao động</th>
                <th className="hidden lg:table-cell text-left px-4 py-3 font-medium text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-gray-600">Worker xác nhận</th>
                <th className="hidden lg:table-cell text-left px-4 py-3 font-medium text-gray-600">Ghi chú</th>
                <th className="hidden md:table-cell text-left px-4 py-3 font-medium text-gray-600">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paymentLoading ? (
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
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[150px] md:max-w-[200px] truncate">{p.job?.title || "—"}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-gray-600">{p.worker?.firstName} {p.worker?.lastName}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-gray-600">{p.type === "FINAL_PAYMENT" ? "Thanh toán cuối" : p.type}</td>
                      <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="hidden sm:table-cell px-4 py-3">{p.confirmedByWorker ? <span className="text-emerald-600 font-medium">✓ Đã xác nhận</span> : <span className="text-gray-400">Chưa</span>}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-gray-600 max-w-[150px] truncate">{p.note || "—"}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">{formatRelativeTime(p.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {paymentTotal > 10 && <div className="px-4 py-3 border-t border-gray-200"><Pagination page={paymentPage} totalPages={Math.ceil(paymentTotal / 10)} onPageChange={setPaymentPage} /></div>}
      </div>
    </>
  );

  const renderMilestones = () => (
    <>
      <div className="flex gap-3 mb-4">
        <SelectFilter value={milestoneStatus} onChange={(v) => { setMilestoneStatus(v); setMilestonePage(1); }} options={milestoneStatusOptions} placeholder="Tất cả trạng thái" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Công việc & Milestone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Người nhận tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tài khoản Ngân hàng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Số tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {milestoneLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-gray-50 rounded animate-pulse" /></td></tr>
                ))
              ) : milestones.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Không có milestone nào</td></tr>
              ) : (
                milestones.map((m) => {
                  const badge = statusBadge[m.status] || { label: m.status, variant: "default" as const };
                  const bank = m.worker?.bankAccounts?.find(b => b.isDefault) || m.worker?.bankAccounts?.[0];
                  
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{m.title}</div>
                        <div className="text-xs text-gray-500 max-w-[200px] truncate" title={m.escrow?.job?.title}>
                          Job: {m.escrow?.job?.title || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {m.worker ? (
                          <div className="flex items-center gap-2">
                            {m.worker.avatarUrl ? (
                              <img src={m.worker.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200" />
                            )}
                            <span className="font-medium">{m.worker.firstName} {m.worker.lastName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {bank ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{bank.bankName}</div>
                            <div className="text-gray-600">{bank.accountNumber} - {bank.accountName}</div>
                            {bank.qrCodeUrl && (
                              <button
                                onClick={() => setQrModal({ isOpen: true, url: bank.qrCodeUrl! })}
                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                              >
                                <span>📷</span> Xem mã QR
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-500 text-xs font-medium">Chưa liên kết NH</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {Number(m.amount).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {m.status === "APPROVED" && (
                          <button 
                            onClick={() => openConfirmModal(m.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Giải ngân
                          </button>
                        )}
                        {m.status === "RELEASED" && (
                          <span className="text-xs text-gray-500">{formatRelativeTime(m.releasedAt!)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {milestoneTotal > 10 && <div className="px-4 py-3 border-t border-gray-200"><Pagination page={milestonePage} totalPages={Math.ceil(milestoneTotal / 10)} onPageChange={setMilestonePage} /></div>}
      </div>
    </>
  );

  const renderEscrows = () => (
    <>
      <div className="flex gap-3 mb-4">
        <SelectFilter value={escrowStatus} onChange={(v) => { setEscrowStatus(v); setEscrowPage(1); }} options={[
          { label: "Chờ hoàn tiền", value: "REFUND_PENDING" },
          { label: "Đã hoàn tiền", value: "REFUNDED" },
        ]} placeholder="Trạng thái" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mã Escrow</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Công việc</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tài khoản nhận hoàn tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tổng tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {escrowLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-gray-50 rounded animate-pulse" /></td></tr>
                ))
              ) : escrows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : (
                escrows.map((e) => {
                  const bank = e.employer?.bankAccounts?.find((b: BankAccount) => b.isDefault) || e.employer?.bankAccounts?.[0];
                  return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{e.id.split('-')[0]}...</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {e.job?.title || "—"}
                      <div className="text-xs text-gray-500 font-normal mt-0.5">Nhà tuyển dụng: {e.employer?.firstName} {e.employer?.lastName}</div>
                    </td>
                    <td className="px-4 py-3">
                      {bank ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{bank.bankName}</div>
                          <div className="text-gray-600">{bank.accountNumber} - {bank.accountName}</div>
                          {bank.qrCodeUrl && (
                            <button
                              onClick={() => setQrModal({ isOpen: true, url: bank.qrCodeUrl! })}
                              className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                            >
                              <span>📷</span> Xem mã QR
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs font-medium">Chưa liên kết NH</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">
                      {Number(e.totalAmount).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-4 py-3"><Badge variant={e.status === 'REFUNDED' ? 'success' : 'warning'}>{e.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {e.status === "REFUND_PENDING" && (
                        <button 
                          onClick={() => setRefundConfirmModal({ isOpen: true, escrowId: e.id })}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                        >
                          Hoàn tiền
                        </button>
                      )}
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        {escrowTotal > 10 && <div className="px-4 py-3 border-t border-gray-200"><Pagination page={escrowPage} totalPages={Math.ceil(escrowTotal / 10)} onPageChange={setEscrowPage} /></div>}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý thanh toán</h1>
        <p className="mt-1 text-sm text-gray-500">Xem và quản lý các giao dịch trên hệ thống</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("offline")}
            className={`${
              activeTab === "offline"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Thanh toán Offline
          </button>
          <button
            onClick={() => setActiveTab("milestone")}
            className={`${
              activeTab === "milestone"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Giải ngân Escrow
          </button>
          <button
            onClick={() => setActiveTab("refund")}
            className={`${
              activeTab === "refund"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Hoàn tiền Escrow
          </button>
        </nav>
      </div>

      {activeTab === "offline" ? renderOfflinePayments() : activeTab === "milestone" ? renderMilestones() : renderEscrows()}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, milestoneId: null })}
        onConfirm={handleReleaseMilestone}
        title="Xác nhận giải ngân"
        message="Xác nhận đã chuyển tiền và giải ngân khoản escrow này cho người lao động?"
        confirmLabel="Giải ngân"
        variant="primary"
        isLoading={isReleasing}
      />

      <ConfirmModal
        isOpen={refundConfirmModal.isOpen}
        onClose={() => setRefundConfirmModal({ isOpen: false, escrowId: null })}
        onConfirm={handleRefundEscrow}
        title="Xác nhận hoàn tiền"
        message="Xác nhận bạn đã chuyển khoản số tiền ký quỹ lại cho Nhà tuyển dụng?"
        confirmLabel="Hoàn tiền"
        variant="danger"
        isLoading={isRefunding}
      />
      
      {qrModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-semibold text-gray-900">Mã QR Thanh Toán</h3>
              <button onClick={() => setQrModal({ isOpen: false, url: "" })} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden p-2">
                <img src={qrModal.url} alt="QR Code" className="w-full h-full object-contain" />
              </div>
              <p className="mt-4 text-sm text-gray-500 text-center">Quét mã QR để thực hiện chuyển khoản.</p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setQrModal({ isOpen: false, url: "" })}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
