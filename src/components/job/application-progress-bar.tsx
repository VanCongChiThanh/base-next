"use client";

import { ApplicationProgress, ProgressStep } from "@/types";
import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

interface Props {
  progress: ApplicationProgress;
  onCheckIn?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  viewAs?: "worker" | "employer";
  onLogHours?: (hours: number) => void;
  onConfirmHours?: () => void;
  onMarkPaid?: () => void;
  onConfirmReceipt?: () => void;
  onRequestRefund?: () => void;
  escrowStatus?: string | null;
}

const STEP_ICONS: Record<string, string> = {
  APPLIED: "📋",
  REVIEWING: "🔍",
  ACCEPTED: "✅",
  CHECKED_IN: "📍",
  IN_PROGRESS: "⚡",
  COMPLETED: "🏆",
};

function StepNode({
  step,
  index,
  isLast,
}: {
  step: ProgressStep;
  index: number;
  isLast: boolean;
}) {
  const statusStyles = {
    done: {
      circle: "bg-emerald-100 border-emerald-500 shadow-emerald-100/40",
      label: "text-emerald-700 font-medium",
      line: "bg-emerald-400",
      icon: "text-emerald-600",
    },
    active: {
      circle: "bg-blue-100 border-blue-500 shadow-blue-100 animate-pulse",
      label: "text-blue-700 font-bold",
      line: "bg-gradient-to-b from-blue-400 to-gray-200",
      icon: "text-blue-600",
    },
    pending: {
      circle: "bg-gray-50 border-gray-200",
      label: "text-gray-400",
      line: "bg-gray-200",
      icon: "text-gray-400",
    },
    failed: {
      circle: "bg-red-50 border-red-500",
      label: "text-red-600 font-medium",
      line: "bg-red-200",
      icon: "text-red-500",
    },
  };

  const s = statusStyles[step.status];

  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg shadow-sm transition-all duration-500 ${s.circle}`}
        >
          <span className={s.icon}>
            {step.status === "done"
              ? "✓"
              : step.status === "failed"
                ? "✗"
                : (STEP_ICONS[step.key] ?? index + 1)}
          </span>
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[32px] mt-1 transition-all duration-700 ${s.line}`}
          />
        )}
      </div>
      <div className="pb-8 pt-1.5 flex-1">
        <p className={`text-sm transition-colors duration-300 ${s.label}`}>
          {step.label}
        </p>
        {step.timestamp && (
          <p className="text-xs text-gray-400 mt-0.5">
            {format(new Date(step.timestamp), "dd/MM/yyyy HH:mm", {
              locale: vi,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  hidden,
}: {
  label: string;
  value?: ReactNode;
  hidden?: boolean;
}) {
  if (!value && !hidden) return null;
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-xs w-28 shrink-0">{label}</span>
      {hidden ? (
        <span className="text-gray-400 text-xs flex items-center gap-1 italic">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Ẩn theo quyền riêng tư
        </span>
      ) : (
        <div className="text-gray-900 text-sm font-medium">{value}</div>
      )}
    </div>
  );
}

export function ApplicationProgressBar({
  progress,
  onCheckIn,
  onComplete,
  onCancel,
  isLoading,
  viewAs = "worker",
  onLogHours,
  onConfirmHours,
  onMarkPaid,
  onConfirmReceipt,
  onRequestRefund,
  escrowStatus,
}: Props) {
  const [loggedHoursInput, setLoggedHoursInput] = useState("");
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);
  const { steps, workerInfo, employerInfo, assignment } = progress;
  
  const currentUserId = viewAs === "worker" ? workerInfo.id : employerInfo?.id;
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "done").length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  const isFailed = steps.some((s) => s.status === "failed");

  const currentStepObj = steps.find((s) => s.status === "active");
  const isAssigned = assignment?.status === "ASSIGNED";
  const isInProgress = assignment?.status === "IN_PROGRESS";
  const isPending =
    !assignment &&
    steps.find((s) => s.key === "REVIEWING")?.status === "active";
  const workerPhone =
    typeof workerInfo.phone === "string" ? workerInfo.phone.trim() : "";
  const workerPhoneHref = workerPhone.replace(/[^\d+]/g, "") || workerPhone;

  const durationMs =
    new Date(progress.endTime).getTime() -
    new Date(progress.startTime).getTime();
  const durationHr = Math.round(durationMs / 3600000) || 1;
  
  let salaryDisplay = "";
  let estimatedTotalDisplay = "";

  if (progress.jobType === "ONLINE") {
    if (progress.onlinePaymentType === "FIXED_PRICE") {
      salaryDisplay = `${Number(progress.totalBudget).toLocaleString("vi-VN")}đ (Khoán)`;
      estimatedTotalDisplay = "Ngân sách cố định";
    } else {
      salaryDisplay = `${Number(progress.salaryPerHour).toLocaleString("vi-VN")}đ/h`;
      estimatedTotalDisplay = `~${(Number(progress.salaryPerHour) * durationHr).toLocaleString("vi-VN")}đ tổng`;
    }
  } else {
    if (progress.salaryType === "FIXED") {
      salaryDisplay = `${Number(progress.salaryPerHour).toLocaleString("vi-VN")}đ/công`;
      estimatedTotalDisplay = "Tiền khoán"; 
    } else {
      salaryDisplay = `${Number(progress.salaryPerHour).toLocaleString("vi-VN")}đ/h`;
      estimatedTotalDisplay = `~${(Number(progress.salaryPerHour) * durationHr).toLocaleString("vi-VN")}đ tổng`;
    }
  }

  const isHourly = progress.jobType === "ONLINE" 
    ? progress.onlinePaymentType === "HOURLY_RATE" 
    : progress.salaryType === "HOURLY";

  return (
    <div className="bg-white border md:border-2 border-blue-50 md:border-blue-100 rounded-2xl overflow-hidden shadow-xl shadow-blue-100/50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 border-b border-blue-100/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-gray-900 font-bold text-lg leading-tight">
              {progress.jobTitle}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              📍 {progress.jobAddress}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-600 font-bold text-xl">{salaryDisplay}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {estimatedTotalDisplay}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {format(new Date(progress.startTime), "HH:mm dd/MM", {
              locale: vi,
            })}
          </span>
          <span className="text-gray-300">→</span>
          <span>
            {format(new Date(progress.endTime), "HH:mm dd/MM", { locale: vi })}
          </span>
          <span className="bg-blue-100 text-blue-700 px-2 rounded-md font-medium">
            {durationHr}h
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-gray-500">
              {currentStepObj
                ? currentStepObj.label
                : isFailed
                  ? "Đã kết thúc"
                  : "Hoàn thành"}
            </span>
            <span className={isFailed ? "text-red-500" : "text-blue-600"}>
              {isFailed ? "✗ Thất bại" : `${percentage}%`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isFailed
                  ? "bg-red-500"
                  : percentage === 100
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-blue-600 to-sky-400"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 px-0.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                  i < completedSteps
                    ? "bg-blue-500 shadow-sm shadow-blue-200"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Steps timeline */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-100">
          <h4 className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Tiến trình công việc
          </h4>
          <div>
            {steps.map((step, i) => (
              <StepNode
                key={step.key}
                step={step}
                index={i}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="w-full md:w-[320px] p-6 space-y-6 bg-gray-50/30">
          {/* Worker info */}
          <div>
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
              {viewAs === "employer"
                ? "Thông tin Ứng viên"
                : "Thông tin của bạn"}
            </h4>
            <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-blue-100 bg-blue-50 flex items-center justify-center shadow-inner">
                {workerInfo.avatarUrl ? (
                  <img
                    src={workerInfo.avatarUrl as string}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-bold text-lg">
                    {String(workerInfo.firstName ?? "?")[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm">
                  {workerInfo.firstName as string}{" "}
                  {workerInfo.lastName as string}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-gray-500 text-xs font-medium">
                    {Number(workerInfo.ratingAvg ?? 0).toFixed(1)} (
                    {workerInfo.totalReviews as number})
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
              <InfoRow
                label="Số điện thoại"
                value={
                  workerPhone ? (
                    <a
                      href={`tel:${workerPhoneHref}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {workerPhone}
                    </a>
                  ) : null
                }
                hidden={!workerPhone}
              />
              <InfoRow
                label="Địa chỉ"
                value={workerInfo.address as string | null}
                hidden={!workerInfo.address}
              />
              <InfoRow
                label="Đã hoàn thành"
                value={`${workerInfo.totalJobsCompleted as number} việc`}
              />
            </div>
            {viewAs === "employer" && !workerPhone && (
              <p className="text-[11px] text-gray-500 mt-2">
                Số điện thoại sẽ hiển thị khi ứng viên cho phép chia sẻ trong hồ
                sơ quyền riêng tư.
              </p>
            )}
          </div>

          {/* Assignment info */}
          {assignment && progress.jobType !== "ONLINE" && (
            <div>
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                Ca làm việc
              </h4>
              <div className="space-y-2 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                {assignment.checkedInAt && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-500 font-medium">Bắt đầu:</span>
                    <span className="text-gray-900 font-semibold">
                      {format(new Date(assignment.checkedInAt), "HH:mm dd/MM", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                )}
                {assignment.completedAt && (
                  <div className="flex items-center gap-2 text-xs pt-1.5 border-t border-gray-50">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-gray-500 font-medium">Kết thúc:</span>
                    <span className="text-gray-900 font-semibold">
                      {format(new Date(assignment.completedAt), "HH:mm dd/MM", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                )}
                {assignment.notes && (
                  <div className="bg-orange-50 rounded-lg p-2.5 text-xs text-orange-800 italic mt-2 border border-orange-100">
                    💬 {assignment.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            <div className="space-y-3">
              {/* REFUND PENDING ALERT */}
              {(escrowStatus === 'REFUND_PENDING' || escrowStatus === 'REFUNDED') && viewAs === "worker" && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 text-center">
                    {escrowStatus === 'REFUND_PENDING'
                      ? '⚠️ Nhà tuyển dụng đã yêu cầu hoàn tiền ký quỹ. Bạn không thể thực hiện thao tác cho đến khi được giải quyết.'
                      : '❌ Khoản ký quỹ đã được hoàn tiền. Công việc này đã kết thúc.'}
                  </p>
                </div>
              )}

              {/* 1. INITIAL ACTIONS (IN_PROGRESS or ASSIGNED) */}
              {(isAssigned || isInProgress) && (
                <>
                  {/* Gig check-in specific */}
                  {isAssigned && onCheckIn && progress.jobType === "GIG" && viewAs === "worker" && (
                    <button
                      onClick={onCheckIn}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "📍 Đã có mặt (Check-in)"}
                    </button>
                  )}

                  {/* Hourly Job: Log Hours */}
                  {isHourly && onLogHours && viewAs === "worker" && (
                    <button
                      onClick={() => setShowLogHoursModal(true)}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Báo cáo số giờ làm"}
                    </button>
                  )}

                  {/* Fixed Job: Complete Assignment */}
                  {!isHourly && onComplete && (
                    <div className="space-y-1">
                      <button
                        onClick={onComplete}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50"
                      >
                        {isLoading ? "Processing..." : "✅ Hoàn thành công việc"}
                      </button>
                      {viewAs === "worker" && (
                        <p className="text-[11px] text-gray-500 text-center italic">
                          Lưu ý: Chỉ xác nhận hoàn thành khi bạn đã hoàn tất công việc (và đã nhận đủ tiền nếu là tiền mặt).
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 2. HOURS SUBMITTED STATE (Hourly jobs only) */}
              {assignment?.status === "HOURS_SUBMITTED" && onConfirmHours && (
                <div className="space-y-2 bg-amber-50 rounded-xl border border-amber-200 p-3">
                  <p className="text-sm font-medium text-amber-900">
                    Báo cáo số giờ đã làm: <b>{assignment.loggedHours} giờ</b>
                  </p>
                  {String(currentUserId) !== String(assignment.hoursSubmittedBy) ? (
                    <button
                      onClick={onConfirmHours}
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Xác nhận số giờ làm"}
                    </button>
                  ) : (
                    <p className="text-xs text-amber-700 italic">Đang chờ đối tác xác nhận...</p>
                  )}
                </div>
              )}

              {/* 3. PAYMENT PENDING STATE */}
              {assignment?.status === "PAYMENT_PENDING" && (
                <div className="space-y-2">
                  {viewAs === "employer" ? (
                    <button
                      onClick={onMarkPaid}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "Xác nhận đã thanh toán"}
                    </button>
                  ) : (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-800 text-center">Đang chờ nhà tuyển dụng xác nhận thanh toán...</p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. PAYMENT SENT STATE */}
              {assignment?.status === "PAYMENT_SENT" && (
                <div className="space-y-2">
                  {viewAs === "worker" ? (
                    <div className="space-y-1">
                      <button
                        onClick={onConfirmReceipt}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                      >
                        {isLoading ? "Processing..." : "Xác nhận đã nhận đủ thanh toán"}
                      </button>
                      <p className="text-[11px] text-red-500 text-center italic mt-1 font-medium">
                        Lưu ý: Bạn chỉ được bấm xác nhận này khi thực tế đã nhận được tiền.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-800 text-center">Đang chờ ứng viên xác nhận đã nhận tiền...</p>
                    </div>
                  )}
                </div>
              )}

              {/* 5. COMPLETED STATE */}
              {assignment?.status === "COMPLETED" && (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                    <span className="text-2xl mb-1 block">🎉</span>
                    <h3 className="text-sm font-bold text-green-900">Công việc hoàn tất!</h3>
                    <p className="text-xs text-green-700 mt-1">Giao dịch đã được xác nhận thành công.</p>
                  </div>
                  {viewAs === "employer" ? (
                    <button
                      onClick={() => document.getElementById("review-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      ⬇ Đánh giá người lao động
                    </button>
                  ) : (
                    <Link
                      href={`/jobs/${progress.jobId}`}
                      className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      Xem chi tiết &amp; Đánh giá đối tác
                    </Link>
                  )}
                </div>
              )}

              {/* CANCEL PENDING APPLICATION */}
              {isPending && onCancel && viewAs === "worker" && (
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full py-3 mt-2 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 font-medium text-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Rút đơn ứng tuyển"}
                </button>
              )}

              {/* REQUEST REFUND FOR EMPLOYER */}
              {onRequestRefund && viewAs === "employer" && assignment?.status !== "COMPLETED" && assignment?.status !== "CANCELLED" && (
                <button
                  onClick={onRequestRefund}
                  disabled={isLoading}
                  className="w-full py-3 mt-2 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Yêu cầu hoàn tiền"}
                </button>
              )}

              {/* FALLBACK MANAGEMENT LINK */}
              {assignment?.status !== "COMPLETED" && (
                <Link
                  href={`/jobs/${progress.jobId}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Về trang chi tiết công việc
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Hours Modal */}
      {showLogHoursModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nhập số giờ hoàn thành</h3>
            <p className="text-sm text-gray-600 mb-4">Vui lòng nhập chính xác số giờ làm việc thực tế để đối tác xác nhận và thanh toán.</p>
            <div className="space-y-2 mb-6">
              <label className="text-sm font-semibold text-gray-700">Số giờ (VD: 10.5)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={loggedHoursInput}
                onChange={(e) => setLoggedHoursInput(e.target.value)}
                placeholder="Nhập số giờ..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogHoursModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  if (onLogHours) {
                    onLogHours(Number(loggedHoursInput));
                    setShowLogHoursModal(false);
                  }
                }}
                disabled={isLoading || !loggedHoursInput || Number(loggedHoursInput) <= 0}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
