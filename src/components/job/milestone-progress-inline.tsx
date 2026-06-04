"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts";
import { paymentService } from "@/services";
import { jobService } from "@/services";
import { Escrow, Milestone, MilestoneStatus, EscrowStatus } from "@/types";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";
import Link from "next/link";

interface MilestoneProgressInlineProps {
  jobId: string;
  employerId: string;
  isAcceptedWorker: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { icon: string; label: string; color: string; bg: string; border: string; ring: string }
> = {
  [MilestoneStatus.PENDING]: {
    icon: "⏳",
    label: "Chờ bắt đầu",
    color: "text-gray-400",
    bg: "bg-gray-100",
    border: "border-gray-200",
    ring: "",
  },
  [MilestoneStatus.IN_PROGRESS]: {
    icon: "⚡",
    label: "Đang thực hiện",
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-300",
    ring: "ring-2 ring-blue-200 animate-pulse",
  },
  [MilestoneStatus.SUBMITTED]: {
    icon: "📤",
    label: "Đã nộp - Chờ duyệt",
    color: "text-amber-600",
    bg: "bg-amber-100",
    border: "border-amber-300",
    ring: "",
  },
  [MilestoneStatus.REVISION_REQUESTED]: {
    icon: "🔄",
    label: "Yêu cầu sửa",
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-300",
    ring: "ring-2 ring-red-200",
  },
  [MilestoneStatus.APPROVED]: {
    icon: "✅",
    label: "Đã duyệt - Chờ giải ngân",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    ring: "",
  },
  [MilestoneStatus.RELEASED]: {
    icon: "💰",
    label: "Đã giải ngân",
    color: "text-purple-600",
    bg: "bg-purple-100",
    border: "border-purple-300",
    ring: "",
  },
  [MilestoneStatus.DISPUTED]: {
    icon: "⚠️",
    label: "Tranh chấp",
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-300",
    ring: "",
  },
};

function MilestoneNode({
  milestone,
  index,
  isLast,
  isWorker,
  actionLoading,
  submitNote,
  onSubmitNoteChange,
  onCompleteMilestone,
}: {
  milestone: Milestone;
  index: number;
  isLast: boolean;
  isWorker: boolean;
  actionLoading: string | null;
  submitNote: string;
  onSubmitNoteChange: (note: string) => void;
  onCompleteMilestone: (milestoneId: string) => void;
}) {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG[MilestoneStatus.PENDING];
  const isActive =
    milestone.status === MilestoneStatus.IN_PROGRESS ||
    milestone.status === MilestoneStatus.REVISION_REQUESTED;
  const isDone =
    milestone.status === MilestoneStatus.RELEASED ||
    milestone.status === MilestoneStatus.APPROVED;
  const isSubmitted = milestone.status === MilestoneStatus.SUBMITTED;

  return (
    <div className="flex flex-col items-center min-w-0" style={{ flex: "1 0 0" }}>
      {/* Top: Node + connector line */}
      <div className="flex items-center w-full">
        {/* Left connector */}
        {index > 0 ? (
          <div
            className={`h-0.5 flex-1 transition-colors duration-500 ${
              isDone || isSubmitted
                ? "bg-emerald-300"
                : isActive
                  ? "bg-gradient-to-r from-emerald-300 to-gray-200"
                  : "bg-gray-200"
            }`}
          />
        ) : (
          <div className="flex-1" />
        )}

        {/* Circle Node */}
        <div
          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center text-base sm:text-lg shrink-0 transition-all duration-500 shadow-sm ${config.bg} ${config.border} ${config.ring}`}
        >
          {isDone ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span>{config.icon}</span>
          )}
          {/* Step number badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-gray-200 text-[9px] font-bold text-gray-500 flex items-center justify-center shadow-sm">
            {index + 1}
          </span>
        </div>

        {/* Right connector */}
        {!isLast ? (
          <div
            className={`h-0.5 flex-1 transition-colors duration-500 ${
              isDone ? "bg-emerald-300" : "bg-gray-200"
            }`}
          />
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Bottom: Labels + Actions */}
      <div className="mt-2 text-center px-1 w-full max-w-[140px] sm:max-w-[180px]">
        <p className={`text-xs sm:text-sm font-semibold truncate ${config.color}`} title={milestone.title}>
          {milestone.title}
        </p>
        <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-0.5">
          {milestone.amount.toLocaleString("vi-VN")}đ
        </p>
        <span
          className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${config.bg} ${config.color}`}
        >
          {config.label}
        </span>

        {/* Revision note */}
        {milestone.status === MilestoneStatus.REVISION_REQUESTED && milestone.revisionNote && (
          <div className="mt-2 p-2 bg-red-50 rounded-lg text-[10px] text-red-700 text-left border border-red-100">
            <span className="font-semibold">Sửa:</span> {milestone.revisionNote}
          </div>
        )}

        {/* Worker: Complete Milestone button */}
        {isWorker && isActive && (
          <div className="mt-2">
            {!showSubmitForm ? (
              <button
                onClick={() => setShowSubmitForm(true)}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={actionLoading === `submit-${milestone.id}`}
              >
                ✅ Hoàn thành milestone
              </button>
            ) : (
              <div className="space-y-2 text-left">
                <textarea
                  placeholder="Link kết quả / ghi chú..."
                  value={submitNote}
                  onChange={(e) => onSubmitNoteChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none"
                  rows={2}
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      onCompleteMilestone(milestone.id);
                      setShowSubmitForm(false);
                    }}
                    disabled={actionLoading === `submit-${milestone.id}`}
                    className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === `submit-${milestone.id}` ? "..." : "Gửi"}
                  </button>
                  <button
                    onClick={() => setShowSubmitForm(false)}
                    className="px-2 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Worker: Submitted status */}
        {isWorker && isSubmitted && (
          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-[10px] text-amber-700 font-medium">📤 Đang chờ duyệt...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MilestoneProgressInline({ jobId, employerId, isAcceptedWorker }: MilestoneProgressInlineProps) {
  const { user } = useAuth();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submitNotes, setSubmitNotes] = useState<Record<string, string>>({});
  const [completeJobLoading, setCompleteJobLoading] = useState(false);
  const [showCompleteJobConfirm, setShowCompleteJobConfirm] = useState(false);

  const fetchEscrow = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getEscrowByJob(jobId);
      setEscrow(data);
    } catch (err: unknown) {
      const errorCode =
        typeof err === "object" && err !== null && "errorCode" in err
          ? (err as { errorCode?: string }).errorCode
          : undefined;
      if (errorCode !== "ESCROW_NOT_FOUND") {
        console.error("Error fetching escrow", err);
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchEscrow();
  }, [fetchEscrow]);

  // Auto clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      setActionLoading(`submit-${milestoneId}`);
      await paymentService.submitMilestone(milestoneId, submitNotes[milestoneId]);
      setSuccess("Đã hoàn thành milestone! Chờ nhà tuyển dụng duyệt.");
      setSubmitNotes((prev) => ({ ...prev, [milestoneId]: "" }));
      await fetchEscrow();
    } catch (err: unknown) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async () => {
    try {
      setCompleteJobLoading(true);
      setShowCompleteJobConfirm(false);
      await jobService.completeOnlineJob(jobId);
      setSuccess("🎉 Công việc đã hoàn thành!");
      await fetchEscrow();
    } catch (err: unknown) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setCompleteJobLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-blue-100 p-6">
        <div className="animate-pulse flex gap-4 items-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-50" />
              <div className="h-3 w-16 bg-blue-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!escrow || !escrow.milestones || escrow.milestones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-blue-100 p-8 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có milestone nào</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Tiến trình công việc sẽ hiển thị ở đây sau khi nhà tuyển dụng tạo và ký quỹ cho các milestone.
        </p>
      </div>
    );
  }

  const milestones = [...escrow.milestones].sort((a, b) => a.orderIndex - b.orderIndex);
  const releasedCount = milestones.filter((m) => m.status === MilestoneStatus.RELEASED).length;
  const totalCount = milestones.length;
  const progressPercent = Math.round((releasedCount / totalCount) * 100);
  const allReleased = milestones.every((m) => m.status === MilestoneStatus.RELEASED);
  const totalReleased = milestones
    .filter((m) => m.status === MilestoneStatus.RELEASED)
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-lg shadow-blue-50/50">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-sky-50 border-b border-blue-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Tiến trình Milestone</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {releasedCount}/{totalCount} hoàn thành
                {totalReleased > 0 && (
                  <span className="text-emerald-600 font-semibold ml-1.5">
                    • {totalReleased.toLocaleString("vi-VN")}đ đã nhận
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            href={`/jobs/${jobId}/escrow`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-100/50 transition-colors"
          >
            Chi tiết
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                allReleased
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-blue-600 to-sky-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-right text-[11px] font-semibold mt-1">
            <span className={allReleased ? "text-emerald-600" : "text-blue-600"}>{progressPercent}%</span>
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-5 sm:mx-6 mt-3 p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-5 sm:mx-6 mt-3 p-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
          {success}
        </div>
      )}

      {/* Horizontal Stepper */}
      <div className="px-3 sm:px-6 py-5 overflow-x-auto">
        <div className="flex items-start" style={{ minWidth: `${Math.max(milestones.length * 150, 300)}px` }}>
          {milestones.map((m, i) => (
            <MilestoneNode
              key={m.id}
              milestone={m}
              index={i}
              isLast={i === milestones.length - 1}
              isWorker={isAcceptedWorker}
              actionLoading={actionLoading}
              submitNote={submitNotes[m.id] || ""}
              onSubmitNoteChange={(note) => setSubmitNotes((prev) => ({ ...prev, [m.id]: note }))}
              onCompleteMilestone={handleCompleteMilestone}
            />
          ))}
        </div>
      </div>

      {/* Complete Job button */}
      {isAcceptedWorker && allReleased && (
        <div className="px-5 sm:px-6 pb-5">
          {!showCompleteJobConfirm ? (
            <button
              onClick={() => setShowCompleteJobConfirm(true)}
              disabled={completeJobLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-400 text-white text-sm font-bold transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="text-base">🏆</span>
              {completeJobLoading ? "Đang xử lý..." : "Hoàn thành công việc"}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
              <p className="text-sm text-emerald-800 font-medium text-center">
                Xác nhận hoàn thành toàn bộ công việc? Tất cả {totalCount} milestones đã được giải ngân.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCompleteJob}
                  disabled={completeJobLoading}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {completeJobLoading ? "Đang xử lý..." : "✓ Xác nhận"}
                </button>
                <button
                  onClick={() => setShowCompleteJobConfirm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All milestones completed celebration */}
      {allReleased && !isAcceptedWorker && (
        <div className="px-5 sm:px-6 pb-5">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-2xl mb-1 block">🎉</span>
            <h3 className="text-sm font-bold text-emerald-900">Tất cả milestones đã hoàn thành!</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Tổng đã giải ngân: {escrow.releasedAmount.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
