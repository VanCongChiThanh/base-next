"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  JobStatusBadge,
  ApplicationStatusBadge,
  ReportModal,
  ReviewSection,
} from "@/components/job";
import { ConfirmModal } from "@/components/common";
import { ScamAnalysisModal } from "@/components/ai/scam-analysis-modal";
import { useAuth, useChat } from "@/contexts";
import { jobService, paymentService, reviewService } from "@/services";
import { saveJob, unsaveJob, checkJobSaved } from "@/services/ai.service";
import {
  Job,
  JobApplication,
  Review,
  JobStatus,
  ApplicationStatus,
  PaymentConfirmation,
  Dispute,
  PaymentType,
  DisputeStatus,
  JobType,
} from "@/types";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";

export default function JobDetailPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { openChat } = useChat();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [myApplication, setMyApplication] = useState<JobApplication | null>(
    null,
  );
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showScamCheck, setShowScamCheck] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const isEmployer = user && job && user.id === job.employerId;
  const isWorkerAndAuthenticated = !isEmployer && isAuthenticated;

  // Calculate estimated earnings
  const durationMs = job ? new Date(job.endTime).getTime() - new Date(job.startTime).getTime() : 0;
  const durationHours = job && job.salaryType === "HOURLY" ? durationMs / (1000 * 60 * 60) : 1;
  const estimatedEarnings = job ? Number(job.salaryPerHour) * durationHours : 0;
  
  // Calculate application stats
  const pendingApps = applications.filter((a) => a.status === ApplicationStatus.PENDING).length;
  const acceptedApps = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED).length;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    jobService
      .getJob(id)
      .then(setJob)
      .catch(() => router.push("/jobs"))
      .finally(() => setIsLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (isEmployer && job) {
      jobService
        .getJobApplications(job.id)
        .then(setApplications)
        .catch(() => {});
    }
  }, [isEmployer, job]);

  useEffect(() => {
    if (isWorkerAndAuthenticated && job) {
      jobService
        .getMyApplication(job.id)
        .then(setMyApplication)
        .catch(() => {});
    }
  }, [isWorkerAndAuthenticated, job]);

  useEffect(() => {
    if (job && isAuthenticated) {
      paymentService
        .getJobPayments(job.id)
        .then(setPayments)
        .catch(() => {});
      paymentService
        .getJobDisputes(job.id)
        .then(setDisputes)
        .catch(() => {});
    }
  }, [job, isAuthenticated]);

  useEffect(() => {
    if (job) {
      reviewService.getByJob(job.id).then(res => setReviews(res?.data || (Array.isArray(res) ? res : []))).catch(() => {});
    }
  }, [job]);

  // Check if job is saved
  useEffect(() => {
    if (job && isAuthenticated && !isEmployer) {
      checkJobSaved(job.id).then((r) => setIsSaved(r.saved)).catch(() => {});
    }
  }, [job, isAuthenticated, isEmployer]);

  const handleToggleSave = async () => {
    if (!job || savingJob) return;
    setSavingJob(true);
    try {
      if (isSaved) {
        await unsaveJob(job.id);
        setIsSaved(false);
      } else {
        await saveJob(job.id);
        setIsSaved(true);
      }
    } catch {} finally {
      setSavingJob(false);
    }
  };

  const canReview = !!(isAuthenticated && job && (
    myApplication?.status === ApplicationStatus.ACCEPTED ||
    (isEmployer && applications.some(a => a.status === ApplicationStatus.ACCEPTED))
  ));
  const revieweeId = isEmployer
    ? applications.find(a => a.status === ApplicationStatus.ACCEPTED)?.workerId
    : job?.employerId;

  const handleApply = async () => {
    if (!isAuthenticated) return router.push("/login");
    setApplying(true);
    setError("");
    try {
      await jobService.applyForJob(id, {
        coverLetter: coverLetter || undefined,
      });
      setSuccess("Ứng tuyển thành công!");
      setShowApplyForm(false);
      setCoverLetter("");
      // Refresh
      const [updatedJob, updatedApp] = await Promise.all([
        jobService.getJob(id),
        jobService.getMyApplication(id),
      ]);
      setJob(updatedJob);
      setMyApplication(updatedApp);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setApplying(false);
    }
  };

  const handleAccept = async (appId: string) => {
    setActionLoading(appId);
    try {
      await jobService.acceptApplication(id, appId);
      const apps = await jobService.getJobApplications(id);
      setApplications(apps);
      setSuccess("Đã chấp nhận ứng viên!");
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: string) => {
    setActionLoading(appId);
    try {
      await jobService.rejectApplication(id, appId);
      const apps = await jobService.getJobApplications(id);
      setApplications(apps);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    setActionLoading("cancel");
    try {
      const updated = await jobService.cancelJob(id);
      setJob(updated);
      setSuccess("Đã huỷ bài đăng!");
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    setShowCompleteConfirm(false);
    setActionLoading("complete");
    try {
      const updated = await jobService.completeJob(id);
      setJob(updated);
      setSuccess("Công việc đã hoàn thành!");
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async () => {
    setActionLoading("payment");
    setError("");
    try {
      await paymentService.confirmPayment(id);
      setSuccess("Đã xác nhận nhận thanh toán!");
      const updated = await paymentService.getJobPayments(id);
      setPayments(updated);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) return;
    setActionLoading("dispute");
    setError("");
    try {
      await paymentService.createDispute(id, disputeReason);
      setSuccess("Đã tạo khiếu nại!");
      setShowDisputeForm(false);
      setDisputeReason("");
      const updated = await paymentService.getJobDisputes(id);
      setDisputes(updated);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const paymentConfirmed = payments.some(
    (p) => p.type === PaymentType.FINAL_PAYMENT && p.confirmedByWorker,
  );
  const hasOpenDispute = disputes.some(
    (d) =>
      d.status === DisputeStatus.OPEN ||
      d.status === DisputeStatus.UNDER_REVIEW,
  );

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-blue-50 rounded-xl w-2/3" />
              <div className="h-4 bg-blue-50 rounded w-1/3" />
              <div className="h-40 bg-blue-50 rounded-2xl" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!job) return null;

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-white border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mb-4 transition-colors"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Quay lại
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {job.title}
                  </h1>
                  <JobStatusBadge status={job.status} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {job.employer.firstName} {job.employer.lastName}
                  </span>
                  <span className="text-blue-200">|</span>
                  <span>{formatRelativeTime(job.createdAt)}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {Number(job.salaryPerHour).toLocaleString("vi-VN")}đ
                  <span className="text-gray-400 font-normal">
                    /{job.salaryType === "FIXED" ? "công" : "giờ"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-2xl border border-blue-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Mô tả công việc
                </h2>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Skills */}
              {job.jobSkills && job.jobSkills.length > 0 && (
                <div className="bg-white rounded-2xl border border-blue-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Kỹ năng yêu cầu
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.jobSkills.map((js) => (
                      <span
                        key={js.id}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium"
                      >
                        {js.skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Form */}
              {!isEmployer &&
                job.status === JobStatus.OPEN &&
                showApplyForm &&
                !myApplication && (
                  <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      Ứng tuyển
                    </h2>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Giới thiệu bản thân và lý do bạn phù hợp với công việc này... (không bắt buộc)"
                      className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/30 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      rows={4}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 disabled:opacity-50 transition-all"
                      >
                        {applying ? "Đang gửi..." : "Gửi ứng tuyển"}
                      </button>
                      <button
                        onClick={() => setShowApplyForm(false)}
                        className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}

              {/* Employer: Applications */}
              {isEmployer && applications.length > 0 && (
                <div className="bg-white rounded-2xl border border-blue-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Đơn ứng tuyển ({applications.length})
                  </h2>
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/30 border border-blue-50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {app.worker.firstName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {app.worker.firstName} {app.worker.lastName}
                            </span>
                            <ApplicationStatusBadge status={app.status} />
                          </div>
                          {app.coverLetter && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {app.coverLetter}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(app.appliedAt)}
                          </p>
                          {app.status === ApplicationStatus.ACCEPTED && (
                            <div className="mt-2 flex items-center gap-2">
                              <Link
                                href={`/applications/${app.id}/progress`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                title="Xem tiến trình chi tiết"
                                aria-label="Xem tiến trình chi tiết"
                              >
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
                                    d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                                  />
                                </svg>
                              </Link>
                              <button
                                onClick={() =>
                                  openChat(
                                    app.id,
                                    app.status as ApplicationStatus,
                                    job?.title,
                                  )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
                                title="Mở chat"
                                aria-label="Mở chat"
                              >
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
                                    d="M8 10h8m-8 4h5m-7 7 4.684-4.684A2 2 0 0111.1 15.9H17a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v13z"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {app.status === ApplicationStatus.PENDING && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleAccept(app.id)}
                              disabled={actionLoading === app.id}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all"
                            >
                              Chấp nhận
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={actionLoading === app.id}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <ReviewSection
                jobId={id}
                reviews={reviews}
                canReview={canReview}
                revieweeId={revieweeId}
                currentUserId={user?.id}
                onReviewCreated={(review) => setReviews((prev) => [review, ...prev])}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Final Payment Confirmation - only after job completed */}
              {myApplication?.status === ApplicationStatus.ACCEPTED && job.status === JobStatus.CLOSED && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
                  <h3 className="text-sm font-semibold text-emerald-800 mb-2">
                    Thanh toán
                  </h3>
                  {!paymentConfirmed ? (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={actionLoading === "payment"}
                      className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all"
                    >
                      {actionLoading === "payment"
                        ? "Đang xử lý..."
                        : "Xác nhận đã nhận thanh toán"}
                    </button>
                  ) : (
                    <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Đã xác nhận thanh toán
                    </p>
                  )}

                  {/* Dispute option */}
                  {!hasOpenDispute && !paymentConfirmed && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      {!showDisputeForm ? (
                        <button
                          onClick={() => setShowDisputeForm(true)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          Có vấn đề? Tạo khiếu nại
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Mô tả vấn đề bạn gặp phải..."
                            className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCreateDispute}
                              disabled={
                                actionLoading === "dispute" ||
                                !disputeReason.trim()
                              }
                              className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all"
                            >
                              Gửi khiếu nại
                            </button>
                            <button
                              onClick={() => {
                                setShowDisputeForm(false);
                                setDisputeReason("");
                              }}
                              className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                            >
                              Huỷ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {hasOpenDispute && (
                    <p className="mt-2 text-xs text-amber-600 font-medium">
                      ⚠ Đang có khiếu nại mở
                    </p>
                  )}
                </div>
              )}

              {/* Payment History */}
              {payments.length > 0 && (
                <div className="bg-white rounded-2xl border border-blue-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Lịch sử xác nhận
                  </h3>
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">Thanh toán</span>
                        <span
                          className={
                            p.confirmedByWorker
                              ? "text-emerald-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {p.confirmedByWorker
                            ? "✓ Đã xác nhận"
                            : "Chờ xác nhận"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employer Application Stats */}
              {isEmployer && applications.length > 0 && (
                <div className="bg-white rounded-2xl border border-blue-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Thống kê ứng tuyển
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <p className="text-xs text-amber-600 font-medium mb-1">Chờ duyệt</p>
                      <p className="text-xl font-bold text-amber-700">{pendingApps}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-medium mb-1">Đã nhận</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {acceptedApps} <span className="text-xs font-normal text-emerald-600">/ {job.requiredWorkers}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Worker Action Card */}
              {!isEmployer &&
                (!showApplyForm || myApplication) &&
                (job.status === JobStatus.OPEN || myApplication) && (
                  <div className="bg-white rounded-2xl border border-blue-100 p-5">
                    {myApplication ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Trạng thái của bạn:
                          </span>
                          <div className="scale-90 origin-right">
                            <ApplicationStatusBadge
                              status={myApplication.status}
                            />
                          </div>
                        </div>
                        <Link
                          href={`/applications/${myApplication.id}/progress`}
                          className="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                        >
                          Xem tiến trình công việc
                          <svg
                            className="w-4 h-4 ml-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </Link>
                      </div>
                    ) : (
                      job.status === JobStatus.OPEN && (
                        <button
                          onClick={() =>
                            isAuthenticated
                              ? setShowApplyForm(true)
                              : router.push("/login")
                          }
                          className="w-full py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
                        >
                          Ứng tuyển ngay
                        </button>
                      )
                    )}
                  </div>
                )}

              {/* Employer Actions */}
              {isEmployer && job.status === JobStatus.OPEN && (
                <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-2">
                  <button
                    onClick={() => setShowCompleteConfirm(true)}
                    disabled={actionLoading === "complete"}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all"
                  >
                    Hoàn thành công việc
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={actionLoading === "cancel"}
                    className="w-full py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-all"
                  >
                    Huỷ bài đăng
                  </button>
                </div>
              )}

              {/* Estimated Earnings (Worker View) */}
              {!isEmployer && job.salaryType === "HOURLY" && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-blue-900">
                      Thu nhập dự kiến
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {estimatedEarnings.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-xs text-blue-600/80 mt-1">
                    Dựa trên thời gian làm việc ({Math.round(durationHours * 10) / 10} giờ)
                  </p>
                </div>
              )}

              {/* Job Info */}
              <div className="bg-white rounded-2xl border border-blue-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Thông tin chi tiết
                </h3>
                <div className="space-y-3">
                  {/* Category */}
                  {job.category && (
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-400">Danh mục</p>
                        <p className="text-sm text-gray-700 font-medium">
                          {job.category.icon} {job.category.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Job Type fields */}
                  {job.jobType === JobType.PART_TIME && (
                    <div className="pt-3 mt-3 border-t border-blue-50 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">🕐</span>
                        <div>
                          <p className="text-xs text-gray-400">Thời hạn hợp đồng</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {job.contractDuration || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">📅</span>
                        <div>
                          <p className="text-xs text-gray-400">Lịch làm việc</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {job.workSchedule || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">💳</span>
                        <div>
                          <p className="text-xs text-gray-400">Ghi chú thanh toán</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {job.paymentNote || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {job.jobType === JobType.ONLINE && (
                    <div className="pt-3 mt-3 border-t border-blue-50 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">💰</span>
                        <div>
                          <p className="text-xs text-gray-400">Tổng ngân sách</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {job.totalBudget ? `${job.totalBudget.toLocaleString("vi-VN")}đ` : "Thỏa thuận"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">📦</span>
                        <div>
                          <p className="text-xs text-gray-400">Sản phẩm yêu cầu</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {job.deliverableType === "FILE"
                              ? "File (thiết kế, tài liệu...)"
                              : job.deliverableType === "LINK"
                                ? "Đường dẫn (website, demo...)"
                                : job.deliverableType === "TEXT"
                                  ? "Đoạn văn bản/dịch thuật"
                                  : job.deliverableType === "OTHER"
                                    ? "Khác"
                                    : job.deliverableType || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Workers needed */}
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400">Cần tuyển</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {job.requiredWorkers} người
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
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
                    <div>
                      <p className="text-xs text-gray-400">Thời gian</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {formatDateTime(job.startTime)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        đến {formatDateTime(job.endTime)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400">Địa điểm</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {job.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employer Card */}
              <div className="bg-white rounded-2xl border border-blue-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Nhà tuyển dụng
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center text-white text-lg font-semibold shadow-sm overflow-hidden">
                    {job.employer.avatarUrl ? (
                      <img
                        src={job.employer.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      job.employer.firstName?.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.employer.firstName} {job.employer.lastName}
                    </p>
                    <p className="text-xs text-gray-400">Nhà tuyển dụng</p>
                  </div>
                </div>
              </div>

              {/* AI Scam Check & Save */}
              {!isEmployer && isAuthenticated && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🛡️</span> Công cụ AI
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowScamCheck(true)}
                      className="w-full py-2.5 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                      <span>🔍</span> Kiểm tra tin lừa đảo
                    </button>
                    <button
                      onClick={handleToggleSave}
                      disabled={savingJob}
                      className={`w-full py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                        isSaved
                          ? "text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                          : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span>{isSaved ? "★" : "☆"}</span>
                      {isSaved ? "Đã lưu" : "Lưu công việc"}
                    </button>
                  </div>
                </div>
              )}

              {/* Report Button */}
              {!isEmployer && isAuthenticated && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowReport(true)}
                    className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                  >
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
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                    Báo cáo tin tuyển dụng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Report Modal */}
      {job && (
        <ReportModal
          jobId={job.id}
          isOpen={showReport}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Scam Analysis Modal */}
      {job && (
        <ScamAnalysisModal
          isOpen={showScamCheck}
          onClose={() => setShowScamCheck(false)}
          jobId={job.id}
          jobTitle={job.title}
        />
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Huỷ bài đăng"
        message="Bạn có chắc chắn muốn huỷ bài đăng này không? Hành động này không thể hoàn tác."
        confirmLabel="Huỷ bài đăng"
        variant="danger"
        isLoading={actionLoading === "cancel"}
      />

      <ConfirmModal
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleComplete}
        title="Hoàn thành công việc"
        message="Xác nhận rằng công việc này đã được hoàn thành tốt đẹp?"
        confirmLabel="Xác nhận hoàn thành"
        variant="success"
        isLoading={actionLoading === "complete"}
      />
    </>
  );
}
