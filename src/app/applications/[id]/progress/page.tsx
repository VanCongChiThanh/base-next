"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, useChat } from "@/contexts";
import { jobService, reviewService } from "@/services";
import { ApplicationProgress, Review } from "@/types";
import { ApplicationProgressBar } from "@/components/job";
import { ReviewSection } from "@/components/job";
import { ConfirmModal } from "@/components/common";
import { Navbar } from "@/components/layout/navbar";
import { BankAccountReminder } from "@/components/profile";
import { paymentService } from "@/services/payment.service";

function useLiveProgress(applicationId: string) {
  const [progress, setProgress] = useState<ApplicationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await jobService.getApplicationProgress(applicationId);
      setProgress(data);
    } catch {
      setError("Không thể tải tiến trình ứng tuyển.");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progress, isLoading, error, refresh };
}

export default function ApplicationProgressPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { openChat } = useChat();
  const { progress, isLoading, error, refresh } = useLiveProgress(id);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [workerReviews, setWorkerReviews] = useState<Review[]>([]);

  // Load worker reviews when progress is available
  useEffect(() => {
    if (progress?.workerInfo?.id) {
      reviewService.getByUser(String(progress.workerInfo.id), 1, 50)
        .then((res) => setWorkerReviews(res?.data || (Array.isArray(res) ? res : [])))
        .catch(() => setWorkerReviews([]));
    }
  }, [progress?.workerInfo?.id]);

  // Auto-open chat if ?chat=1 is in the URL (e.g., from notification click)
  useEffect(() => {
    if (searchParams.get("chat") === "1" && progress) {
      openChat(
        progress.applicationId,
        progress.applicationStatus,
        progress.jobTitle,
      );
    }
  }, [searchParams, progress, openChat]);

  const handleCheckIn = async () => {
    if (!progress) return;
    setActionLoading(true);
    try {
      await jobService.checkIn(progress.jobId);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!progress) return;
    setShowCompleteConfirm(false);
    setActionLoading(true);
    try {
      await jobService.completeAssignment(progress.jobId);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!progress) return;
    setShowCancelConfirm(false);
    setActionLoading(true);
    try {
      await jobService.cancelApplication(progress.applicationId);
      router.push("/dashboard");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogHours = async (hours: number) => {
    if (!progress) return;
    setActionLoading(true);
    try {
      await jobService.logHours(progress.jobId, hours);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmHours = async () => {
    if (!progress) return;
    setActionLoading(true);
    try {
      await jobService.confirmHours(progress.jobId);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!progress) return;
    setActionLoading(true);
    try {
      await jobService.markPaid(progress.jobId);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!progress) return;
    setActionLoading(true);
    try {
      await jobService.confirmPaymentReceipt(progress.jobId);
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!progress || !refundReason.trim()) return;
    setActionLoading(true);
    setShowRefundModal(false);
    try {
      await paymentService.requestRefund(progress.jobId, progress.applicationId, refundReason);
      alert("Đã gửi yêu cầu hoàn tiền thành công. Quản trị viên sẽ xử lý sớm.");
      await refresh();
    } catch (e: any) {
      alert("Lỗi: " + (e?.response?.data?.message || e.message || "Không thể yêu cầu hoàn tiền"));
    } finally {
      setActionLoading(false);
      setRefundReason("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-sm" />
            <p className="text-gray-500 text-sm font-medium">
              Đang tải tiến trình...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4">😕</p>
            <p className="text-gray-900 font-semibold">
              {error ?? "Không tìm thấy thông tin"}
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-blue-600 font-medium text-sm hover:underline"
            >
              ← Quay lại trang trước
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = user?.id ? String(user.id) : null;
  const employerId =
    progress.employerInfo &&
    typeof progress.employerInfo === "object" &&
    "id" in progress.employerInfo
      ? String(progress.employerInfo.id)
      : null;

  // Backend đã validate quyền truy cập rồi (trả về 200).
  // Ở đây chỉ cần xác định giao diện hiển thị: employer hay worker.
  const isEmployerView =
    user?.role === "RECRUITER" ||
    (!!currentUserId && !!employerId && currentUserId === employerId);

  const viewAs = isEmployerView ? "employer" : "worker";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!isEmployerView && <BankAccountReminder />}
        
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm transition-all"
            title="Quay lại"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-gray-900 font-bold text-2xl">
              Tiến trình công việc
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Theo dõi chi tiết các bước trong thoả thuận của bạn
            </p>
          </div>
          <button
            onClick={refresh}
            className="ml-auto w-10 h-10 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 shadow-sm transition-all"
            title="Làm mới"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={() =>
              openChat(
                progress.applicationId,
                progress.applicationStatus,
                progress.jobTitle,
              )
            }
            className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm transition-all bg-white hover:bg-blue-50 border-gray-200 text-gray-500 hover:text-blue-600"
            title="Mở cửa sổ chat"
            aria-label="Mở cửa sổ chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h6m-8 9 4.684-4.684A2 2 0 0111.1 15.9H17a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v13z"
              />
            </svg>
          </button>
        </div>

        <ApplicationProgressBar
          progress={progress}
          onCheckIn={handleCheckIn}
          onComplete={() => setShowCompleteConfirm(true)}
          onCancel={() => setShowCancelConfirm(true)}
          isLoading={actionLoading}
          viewAs={viewAs}
          onLogHours={handleLogHours}
          onConfirmHours={handleConfirmHours}
          onMarkPaid={handleMarkPaid}
          onConfirmReceipt={handleConfirmReceipt}
          onRequestRefund={progress.paymentMethod === 'ESCROW' ? () => setShowRefundModal(true) : undefined}
        />

        {/* Review Section for Employer to review Worker */}
        {isEmployerView && progress.assignment?.status === "COMPLETED" && (
          <div id="review-section" className="mt-6">
            <ReviewSection
              jobId={progress.jobId}
              reviews={workerReviews.filter((r) => r.revieweeId === String(progress.workerInfo?.id))}
              canReview={true}
              revieweeId={String(progress.workerInfo?.id)}
              currentUserId={currentUserId ?? undefined}
              onReviewCreated={(review) => setWorkerReviews((prev) => [review, ...prev])}
            />
          </div>
        )}

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-8 9 4.684-4.684A2 2 0 0111.1 15.9H17a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v13z" />
          </svg>
          <p className="text-sm text-gray-700 flex-1">
            Bạn có thể nhắn tin trao đổi trực tiếp với{" "}
            {viewAs === "employer" ? "ứng viên" : "nhà tuyển dụng"}.
          </p>
          <button
            onClick={() =>
              openChat(
                progress.applicationId,
                progress.applicationStatus,
                progress.jobTitle,
              )
            }
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shrink-0"
          >
            Mở chat
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Rút đơn ứng tuyển"
        message="Bạn có chắc chắn muốn rút đơn ứng tuyển? Hành động này không thể hoàn tác."
        confirmLabel="Đồng ý rút"
        isLoading={actionLoading}
      />

      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Yêu cầu hoàn tiền</h3>
            <p className="text-sm text-gray-600 mb-4">Vui lòng cho biết lý do bạn muốn yêu cầu hoàn tiền cho khoản ký quỹ này.</p>
            <div className="space-y-2 mb-6">
              <label className="text-sm font-semibold text-gray-700">Lý do</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Nhập lý do..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={actionLoading || !refundReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleComplete}
        title="Hoàn thành công việc"
        message={viewAs === "worker" ? "Xác nhận rằng bạn đã hoàn tất công việc (và đã nhận đủ tiền nếu thu tiền mặt)?" : "Xác nhận rằng công việc này đã được hoàn thành tốt đẹp?"}
        confirmLabel="Xác nhận hoàn thành"
        variant="success"
        isLoading={actionLoading}
      />
    </div>
  );
}
