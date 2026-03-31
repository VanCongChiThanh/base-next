"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, useChat } from "@/contexts";
import { jobService } from "@/services";
import { ApplicationProgress } from "@/types";
import { ApplicationProgressBar } from "@/components/job";
import { ConfirmModal } from "@/components/common";
import { Navbar } from "@/components/layout/navbar";

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
    setActionLoading(true);
    try {
      await jobService.completeJob(progress.jobId);
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
      router.push("/worker/job-history");
    } finally {
      setActionLoading(false);
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
  const workerId =
    progress.workerInfo &&
    typeof progress.workerInfo === "object" &&
    "id" in progress.workerInfo
      ? String(progress.workerInfo.id)
      : null;
  const isEmployerView =
    !!currentUserId && !!employerId && currentUserId === employerId;
  const canAccessConversation =
    !!currentUserId &&
    ((!!employerId && currentUserId === employerId) ||
      (!!workerId && currentUserId === workerId));
  const viewAs = isEmployerView ? "employer" : "worker";

  if (!canAccessConversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-2xl mb-2">🔒</p>
            <h2 className="text-gray-900 font-semibold">
              Không thể mở tiến trình này
            </h2>
            <p className="text-sm text-amber-800 mt-2">
              Chỉ ứng viên của đơn và nhà tuyển dụng của công việc mới được xem
              chat trong tiến trình.
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
          onComplete={handleComplete}
          onCancel={() => setShowCancelConfirm(true)}
          isLoading={actionLoading}
          viewAs={viewAs}
        />

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
        message="Bạn có chắc chắn muốn rút đơn ứng tuyển này? Hành động này không thể hoàn tác."
        variant="danger"
        confirmLabel="Rút đơn"
        isLoading={actionLoading}
      />
    </div>
  );
}
