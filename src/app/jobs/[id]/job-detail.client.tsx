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
  EscrowSection,
  JobProgressInline,
} from "@/components/job";
import { ConfirmModal } from "@/components/common";
import { ScamAnalysisAlert } from "@/components/ai/scam-analysis-alert";
import { MatchedCandidates } from "@/components/ai/matched-candidates";
import { BankAccountReminder } from "@/components/profile";
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
  PaymentMethod,
  BankAccount,
  PaymentStatus,
  OnlinePaymentType,
  ApplicationProgress,
  Escrow,
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
  const [appProgress, setAppProgress] = useState<ApplicationProgress | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
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
  const [showWorkerCompleteConfirm, setShowWorkerCompleteConfirm] = useState(false);
  const [showConfirmReceipt, setShowConfirmReceipt] = useState(false);
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);
  const [acceptConfirmAppId, setAcceptConfirmAppId] = useState<string | null>(null);
  const [regularAcceptConfirmAppId, setRegularAcceptConfirmAppId] = useState<string | null>(null);
  const [showApproveCompleteConfirm, setShowApproveCompleteConfirm] = useState(false);
  const [showApprovePaymentConfirm, setShowApprovePaymentConfirm] = useState(false);
  const [loggedHoursInput, setLoggedHoursInput] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [p2pBankAccounts, setP2pBankAccounts] = useState<BankAccount[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refundAppId, setRefundAppId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const isEmployer = user && job && (user.id === job.employerId || user.id === (job as any).postedById);
  const isWorkerAndAuthenticated = !isEmployer && isAuthenticated && user?.role === "USER";

  // Calculate estimated earnings
  const durationMs = job && job.endTime && job.startTime ? new Date(job.endTime).getTime() - new Date(job.startTime).getTime() : 0;
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
        .then(async (app) => {
          setMyApplication(app);
          if (app) {
            try {
              const progress = await jobService.getApplicationProgress(app.id);
              setAppProgress(progress);
              if (job.paymentMethod === PaymentMethod.ESCROW) {
                const escrowData = await paymentService.getEscrowByJob(job.id);
                setEscrow(escrowData);
              }
            } catch (err) {
              // ignore
            }
          }
        })
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
      // Fetch employer bank accounts for P2P jobs
      if (job.paymentMethod === PaymentMethod.P2P) {
        paymentService
          .getP2PInfo(job.id)
          .then(d => setP2pBankAccounts(d.bankAccounts))
          .catch(() => {});
      }
    }
  }, [job, isAuthenticated]);

  useEffect(() => {
    if (job) {
      reviewService.getByJob(job.id)
        .then(res => {
          const all: Review[] = res?.data || (Array.isArray(res) ? res : []);
          // Chỉ hiện review dành cho employer/tổ chức, không hiện review của employer dành cho worker
          setReviews(all.filter(r => r.revieweeId === job.employerId));
        })
        .catch(() => {});
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

  const canReview = !!(isAuthenticated && job && 
    (job.status === JobStatus.COMPLETED || job.status === JobStatus.SETTLED) &&
    (
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

  const handleAcceptClick = (appId: string) => {
    const isEscrow = job?.paymentMethod === PaymentMethod.ESCROW || (job as any)?.paymentMethod === 'ESCROW';
    const isGigOrPartTime = job?.jobType === JobType.GIG || job?.jobType === JobType.PART_TIME;
    
    if (isEscrow && isGigOrPartTime) {
      setAcceptConfirmAppId(appId);
    } else {
      setRegularAcceptConfirmAppId(appId);
    }
  };

  const handleAccept = async (appId: string) => {
    setActionLoading(appId);
    setAcceptConfirmAppId(null);
    setRegularAcceptConfirmAppId(null);
    try {
      const isEscrow = job?.paymentMethod === PaymentMethod.ESCROW || (job as any)?.paymentMethod === 'ESCROW';
      const isGigOrPartTime = job?.jobType === JobType.GIG || job?.jobType === JobType.PART_TIME;

      if (isEscrow && isGigOrPartTime) {
        const res = await paymentService.createApplicationEscrow(id, appId);
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
          return; // Redirecting to PayOS
        }
      } else {
        await jobService.acceptApplication(id, appId);
        const apps = await jobService.getJobApplications(id);
        setApplications(apps);
        setSuccess("Đã chấp nhận ứng viên!");
      }
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

  const handleRequestRefund = async () => {
    if (!refundAppId || !refundReason.trim() || !job) return;
    setActionLoading("refund_" + refundAppId);
    try {
      await paymentService.requestRefund(job.id, refundAppId, refundReason);
      setSuccess("Đã gửi yêu cầu hoàn tiền. Quản trị viên sẽ xử lý sớm.");
      const apps = await jobService.getJobApplications(job.id);
      setApplications(apps);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
      setRefundAppId(null);
      setRefundReason("");
    }
  };

  const handleApproveComplete = async () => {
    if (!job) return;
    setShowApproveCompleteConfirm(false);
    setActionLoading("approve_complete");
    setError("");
    try {
      await jobService.completeAssignment(job.id);
      setSuccess("Đã xác nhận hoàn thành công việc!");
      // Tải lại applications để cập nhật trạng thái
      const apps = await jobService.getJobApplications(job.id);
      setApplications(apps);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovePayment = async () => {
    if (!job) return;
    setShowApprovePaymentConfirm(false);
    setActionLoading("approve_payment");
    setError("");
    try {
      await jobService.markPaid(job.id);
      setSuccess("Đã xác nhận thanh toán!");
      // Tải lại applications
      const apps = await jobService.getJobApplications(job.id);
      setApplications(apps);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondAcceptance = async (accept: boolean) => {
    if (!myApplication) return;
    setActionLoading(myApplication.id);
    setError("");
    try {
      const updatedApp = await jobService.respondApplicationAcceptance(
        myApplication.id,
        accept,
      );
      setMyApplication(updatedApp);
      const updatedJob = await jobService.getJob(id);
      setJob(updatedJob);
      setSuccess(
        accept
          ? "Bạn đã xác nhận nhận việc!"
          : "Bạn đã từ chối lời xác nhận từ nhà tuyển dụng.",
      );
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

  const handleWorkerComplete = async () => {
    setShowWorkerCompleteConfirm(false);
    setActionLoading("complete");
    try {
      await jobService.completeAssignment(id);
      setSuccess("Đã xác nhận hoàn thành công việc!");
      const updated = await jobService.getJob(id);
      setJob(updated);
      // Refresh progress
      if (myApplication) {
        const progress = await jobService.getApplicationProgress(myApplication.id);
        setAppProgress(progress);
      }
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading("checkIn");
    setError("");
    try {
      await jobService.checkIn(id);
      setSuccess("Đã xác nhận có mặt (Check-in)!");
      const updated = await jobService.getJob(id);
      setJob(updated);
      if (myApplication) {
        const progress = await jobService.getApplicationProgress(myApplication.id);
        setAppProgress(progress);
      }
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogHours = async (hours: number) => {
    setShowLogHoursModal(false);
    setActionLoading("logHours");
    try {
      await jobService.logHours(id, hours);
      setSuccess("Đã báo cáo số giờ làm!");
      const updated = await jobService.getJob(id);
      setJob(updated);
      if (myApplication) {
        const progress = await jobService.getApplicationProgress(myApplication.id);
        setAppProgress(progress);
      }
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmHours = async (appId: string) => {
    setActionLoading("confirmHours_" + appId);
    try {
      await jobService.confirmHours(id);
      setSuccess("Đã xác nhận số giờ làm!");
      const updated = await jobService.getJob(id);
      setJob(updated);
      const apps = await jobService.getJobApplications(id);
      setApplications(apps);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleWorkerConfirmReceipt = async () => {
    setShowConfirmReceipt(false);
    setActionLoading("confirmReceipt");
    try {
      await jobService.confirmPaymentReceipt(id);
      try {
        await paymentService.confirmPayment(id);
      } catch (e) {
        console.error("Auto confirm final payment failed", e);
      }
      setSuccess("Đã xác nhận nhận đủ thanh toán!");
      const updated = await jobService.getJob(id);
      setJob(updated);
      if (myApplication) {
        const progress = await jobService.getApplicationProgress(myApplication.id);
        setAppProgress(progress);
      }
      const updatedPayments = await paymentService.getJobPayments(id);
      setPayments(updatedPayments);
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

  const finalPayment = payments.find((p) => p.type === PaymentType.FINAL_PAYMENT);
  const isConfirmedByMe = isEmployer ? finalPayment?.confirmedByEmployer : finalPayment?.confirmedByWorker;
  const isFullyConfirmed = finalPayment?.status === PaymentStatus.PAYMENT_CONFIRMED;
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

  if (isEmployer) {
    const filteredApps = applications.filter(app => {
      const matchStatus = statusFilter === "ALL" || app.status === statusFilter;
      const matchSearch = (app.worker.firstName + " " + app.worker.lastName).toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });

    return (
      <>
        <Navbar />
        <main className="flex-1 min-h-screen bg-slate-50 pb-12">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4 transition-colors font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Quay lại danh sách
              </Link>
              
              {!isEmployer && isAuthenticated && <ScamAnalysisAlert jobId={job.id} />}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{job.title}</h1>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    
                  </div>
                </div>
                <div className="text-left md:text-right">
                  {job.jobType === JobType.ONLINE ? (
                    <>
                      <p className="text-3xl font-bold text-blue-600">{job.onlinePaymentType === "FIXED_PRICE" ? `${job.totalBudget?.toLocaleString("vi-VN")}đ` : `${job.hourlyRateMin?.toLocaleString("vi-VN")}đ - ${job.hourlyRateMax?.toLocaleString("vi-VN")}đ`}</p>
                      <p className="text-sm text-gray-500 font-medium mt-1">{job.onlinePaymentType === "FIXED_PRICE" ? "Ngân sách cố định" : "Theo giờ"}</p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-blue-600">{Number(job.salaryPerHour).toLocaleString("vi-VN")}đ<span className="text-gray-500 text-lg font-normal">/{job.salaryType === "FIXED" ? "công" : "giờ"}</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            {success && <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>}

            {isWorkerAndAuthenticated && (
              <BankAccountReminder />
            )}

            {/* Job Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {!job.isDirectHire && (
                  <MatchedCandidates job={job} />
                )}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Mô tả công việc</h2>
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">{job.description}</p>
                </div>
                {job.jobSkills && job.jobSkills.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Kỹ năng yêu cầu</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.jobSkills.map(js => <span key={js.id} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">{js.skill?.name}</span>)}
                    </div>
                  </div>
                )}
                
                {/* Reviews Section */}
                <ReviewSection
                  jobId={id}
                  reviews={reviews}
                  canReview={false}
                  revieweeId={undefined}
                  currentUserId={user?.id}
                  onReviewCreated={(review) => setReviews((prev) => [review, ...prev])}
                />
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Tổng quan</h2>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between pb-3 border-b border-gray-100"><span className="text-gray-500">Danh mục</span><span className="font-medium text-gray-900">{job.category?.name || "Khác"}</span></div>
                    {job.startTime ? (
                      <div className="flex justify-between pb-3 border-b border-gray-100">
                        <span className="text-gray-500">Thời gian</span>
                        <span className="font-medium text-gray-900">
                          {formatDateTime(job.startTime)}
                          {job.endTime ? ` - ${formatDateTime(job.endTime)}` : ""}
                        </span>
                      </div>
                    ) : job.deadline ? (
                      <div className="flex justify-between pb-3 border-b border-gray-100">
                        <span className="text-gray-500">Deadline</span>
                        <span className="font-medium text-gray-900">
                          {formatDateTime(job.deadline)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex justify-between"><span className="text-gray-500">Hình thức thanh toán</span><span className="font-medium text-gray-900">{job.paymentMethod === PaymentMethod.ESCROW ? "Ký quỹ (Escrow)" : job.paymentMethod === PaymentMethod.P2P ? "Trực tiếp" : "Tiền mặt"}</span></div>
                  </div>
                </div>
                
                {/* Actions & Confirm Payment */}
                {(job.status === JobStatus.COMPLETED || job.status === JobStatus.SETTLED) && job.jobType !== JobType.ONLINE && (
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-emerald-800 mb-3">Xác nhận thanh toán</h3>
                    {!isConfirmedByMe ? (
                      <button onClick={handleConfirmPayment} disabled={actionLoading === "payment"} className="w-full py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all shadow-sm">
                        {actionLoading === "payment" ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-emerald-600 font-bold flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Bạn đã xác nhận</p>
                        {!isFullyConfirmed && <p className="text-xs text-emerald-600/70">Chờ người làm xác nhận...</p>}
                        {isFullyConfirmed && <p className="text-sm font-bold text-emerald-700 bg-emerald-100/50 p-2 rounded-lg mt-2 text-center">✓ Giao dịch hoàn tất</p>}
                      </div>
                    )}
                  </div>
                )}
                {job.status === JobStatus.OPEN && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-3">
                    {showCancelConfirm ? (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-sm text-red-800 mb-3 font-medium">Bạn có chắc muốn huỷ bài đăng này?</p>
                        <div className="flex gap-2">
                          <button onClick={handleCancel} className="flex-1 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Xác nhận</button>
                          <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Quay lại</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowCancelConfirm(true)} className="w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 transition-colors">Huỷ bài đăng</button>
                    )}
                  </div>
                )}
                {job.status === JobStatus.OPEN && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    {showCompleteConfirm ? (
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-sm text-emerald-800 mb-3 font-medium">Xác nhận công việc đã hoàn thành?</p>
                        <div className="flex gap-2">
                          <button onClick={handleComplete} className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Xác nhận</button>
                          <button onClick={() => setShowCompleteConfirm(false)} className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Quay lại</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowCompleteConfirm(true)} className="w-full py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 shadow-sm transition-all">Đánh dấu hoàn thành</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Application Data Table Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Danh sách Ứng viên ({applications.length})
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Tìm tên ứng viên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64" />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="ACCEPTED">Đã nhận</option>
                    <option value="EMPLOYER_ACCEPTED">Chờ ứng viên XN</option>
                    <option value="REJECTED">Đã từ chối</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ứng viên</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kinh nghiệm</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày ứng tuyển</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApps.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">Không tìm thấy ứng viên nào phù hợp.</td></tr>
                    ) : filteredApps.map(app => (
                      <tr key={app.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Link href={`/users/${app.workerId}`} className="flex-shrink-0">
                              {app.worker.avatarUrl ? (
                                <img src={app.worker.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{app.worker.firstName?.charAt(0)}</div>
                              )}
                            </Link>
                            <div>
                              <Link href={`/users/${app.workerId}`} className="font-semibold text-gray-900 hover:text-blue-600">{app.worker.firstName} {app.worker.lastName}</Link>
                              {(app.worker.verificationLevel === "BASIC" || app.worker.verificationLevel === "BUSINESS") ? (
                                <div className="mt-0.5"><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">✓ Đã xác thực</span></div>
                              ) : (
                                <div className="mt-0.5"><span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">⚠️ Chưa xác thực</span></div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {app.worker.workerProfile ? (
                            <div className="flex flex-col gap-1 text-xs text-gray-600">
                              <span className="font-medium text-amber-600 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {Number(app.worker.workerProfile.ratingAvg || 0).toFixed(1)} sao</span>
                              <span>{app.worker.workerProfile.totalJobsCompleted || 0} việc hoàn thành</span>
                            </div>
                          ) : <span className="text-xs text-gray-400">Chưa có dữ liệu</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(app.appliedAt)}</td>
                        <td className="px-6 py-4"><ApplicationStatusBadge status={app.status} /></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {(app.status === ApplicationStatus.PENDING || app.status === ApplicationStatus.ACCEPTED || app.status === ApplicationStatus.EMPLOYER_ACCEPTED) && (
                              <button onClick={() => openChat(app.id, app.status as ApplicationStatus, job.title)} className="px-3 py-1.5 text-xs font-medium bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Nhắn tin">💬 Chat</button>
                            )}
                            {/* Nút Chi tiết cho phép Employer xem tiến trình và đánh giá */}
                            {app.status === ApplicationStatus.ACCEPTED && isEmployer && (
                              <Link href={`/applications/${app.id}/progress`} className="px-3 py-1.5 text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">Chi tiết</Link>
                            )}
                            {/* Nút Yêu cầu hoàn tiền: hiển thị khi ESCROW + worker chưa check-in hoặc worker đã huỷ/từ chối */}
                            {(app.status === ApplicationStatus.ACCEPTED || app.status === ApplicationStatus.CANCELLED || app.status === ApplicationStatus.REJECTED) && isEmployer && (job.paymentMethod === PaymentMethod.ESCROW || (job as any).paymentMethod === 'ESCROW') && app.assignment && (app.assignment.status === "ASSIGNED" || app.assignment.status === "CANCELLED") && (
                              <button
                                onClick={() => setRefundAppId(app.id)}
                                disabled={actionLoading === "refund_" + app.id}
                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === "refund_" + app.id ? "Đang xử lý..." : "💰 Hoàn tiền"}
                              </button>
                            )}
                            {/* Tiến trình UI has been merged into this page */}
                            {app.status === ApplicationStatus.ACCEPTED && job.paymentMethod === PaymentMethod.P2P && (
                              <button onClick={() => setShowBankModal(true)} className="px-3 py-1.5 text-xs font-medium bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">🏦 Ngân hàng</button>
                            )}
                            {app.status === ApplicationStatus.PENDING && (
                              <>
                                <button onClick={() => handleAcceptClick(app.id)} disabled={actionLoading === app.id} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Nhận</button>
                                <button onClick={() => handleReject(app.id)} disabled={actionLoading === app.id} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">Từ chối</button>
                              </>
                            )}
                            {app.assignment?.status === "HOURS_SUBMITTED" && (
                              <div className="flex flex-col items-end gap-1">
                                <div className="text-xs text-gray-600">
                                  Báo cáo: <span className="font-bold text-gray-900">{app.assignment.loggedHours} giờ</span>
                                  {job.salaryPerHour && (
                                    <span className="ml-1 text-emerald-600 font-medium">
                                      ({Number((app.assignment.loggedHours || 0) * Number(job.salaryPerHour)).toLocaleString("vi-VN")} đ)
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleConfirmHours(app.id)}
                                  disabled={actionLoading === "confirmHours_" + app.id}
                                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                                >
                                  {actionLoading === "confirmHours_" + app.id ? "Đang xử lý..." : "Xác nhận số giờ làm"}
                                </button>
                              </div>
                            )}
                            {(app.assignment?.status === "ASSIGNED" || app.assignment?.status === "IN_PROGRESS") && job.salaryType !== "HOURLY" ? (
                              <button
                                onClick={() => setShowApproveCompleteConfirm(true)}
                                disabled={actionLoading === "approve_complete"}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-all disabled:opacity-50"
                              >
                                {actionLoading === "approve_complete" ? "Đang xử lý..." : "Xác nhận hoàn thành"}
                              </button>
                            ) : null}
                            {app.assignment?.status === "PAYMENT_PENDING" ? (
                              <button
                                onClick={() => setShowApprovePaymentConfirm(true)}
                                disabled={actionLoading === "approve_payment"}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
                              >
                                {actionLoading === "approve_payment" ? "Đang xử lý..." : (job.paymentMethod === PaymentMethod.P2P ? "Xác nhận thanh toán" : "Xác nhận")}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Escrow Section - only for FIXED_PRICE, not HOURLY_RATE */}
            {job.jobType === JobType.ONLINE && job.paymentMethod === PaymentMethod.ESCROW && job.onlinePaymentType !== "HOURLY_RATE" && (
              <div className="mt-6"><EscrowSection job={job} /></div>
            )}
            
            {/* Bank Modal */}
            {showBankModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><span className="text-xl">🤝</span>Thanh toán trực tiếp</h3>
                    <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-600">Thông tin chuyển khoản của ứng viên đã được xác nhận:</p>
                    {p2pBankAccounts.length === 0 ? (
                      <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
                        <p className="text-sm font-medium text-amber-800 flex items-center gap-2">⚠ Ứng viên chưa cập nhật tài khoản.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {p2pBankAccounts.map((acc) => (
                          <div key={acc.id} className="bg-white rounded-xl border border-blue-100 p-4 flex gap-4 items-start shadow-sm">
                            {acc.qrCodeUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={acc.qrCodeUrl} alt="QR" className="w-16 h-16 rounded-xl object-contain border border-gray-100 shrink-0" />
                            ) : <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center text-3xl shrink-0">🏦</div>}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{acc.bankName}</p>
                              <p className="text-base font-mono text-blue-700 mt-1">{acc.accountNumber}</p>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{acc.accountName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={() => setShowBankModal(false)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">Đóng</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <ConfirmModal
          isOpen={!!acceptConfirmAppId}
          onClose={() => setAcceptConfirmAppId(null)}
          onConfirm={() => {
            if (acceptConfirmAppId) {
              handleAccept(acceptConfirmAppId);
            }
          }}
          title="Xác nhận thanh toán Escrow"
          message={`Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán PayOS để nạp quỹ Escrow cho ứng viên này. Sau khi thanh toán thành công, lời mời làm việc sẽ được gửi đi và công việc sẽ bắt đầu ngay khi ứng viên đồng ý. Bạn có muốn tiếp tục?`}
          confirmLabel="Tiếp tục thanh toán"
          variant="primary"
          isLoading={!!acceptConfirmAppId && actionLoading === acceptConfirmAppId}
        />
        <ConfirmModal
          isOpen={!!regularAcceptConfirmAppId}
          onClose={() => setRegularAcceptConfirmAppId(null)}
          onConfirm={() => {
            if (regularAcceptConfirmAppId) {
              handleAccept(regularAcceptConfirmAppId);
            }
          }}
          title="Xác nhận duyệt ứng viên"
          message="Bạn có chắc chắn muốn nhận ứng viên này không? Sau khi duyệt, ứng viên sẽ nhận được thông báo để bắt đầu công việc."
          confirmLabel="Duyệt ứng viên"
          variant="primary"
          isLoading={!!regularAcceptConfirmAppId && actionLoading === regularAcceptConfirmAppId}
        />
        <ConfirmModal
          isOpen={showApproveCompleteConfirm}
          onClose={() => setShowApproveCompleteConfirm(false)}
          onConfirm={handleApproveComplete}
          title="Xác nhận hoàn thành"
          message="Bạn có chắc chắn xác nhận ứng viên đã hoàn thành công việc được giao?"
          confirmLabel="Xác nhận"
          variant="success"
          isLoading={actionLoading === "approve_complete"}
        />
        <ConfirmModal
          isOpen={showApprovePaymentConfirm}
          onClose={() => setShowApprovePaymentConfirm(false)}
          onConfirm={handleApprovePayment}
          title="Xác nhận thanh toán"
          message="Bạn có chắc chắn xác nhận đã thanh toán lương cho ứng viên này?"
          confirmLabel="Xác nhận"
          variant="success"
          isLoading={actionLoading === "approve_payment"}
        />
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

        {/* Modal Yêu cầu hoàn tiền Escrow */}
        {refundAppId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💰 Yêu cầu hoàn tiền</h3>
              <p className="text-sm text-gray-600 mb-4">Ứng viên chưa xác nhận làm việc. Vui lòng cho biết lý do yêu cầu hoàn tiền khoản ký quỹ.</p>
              <div className="space-y-2 mb-6">
                <label className="text-sm font-semibold text-gray-700">Lý do</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Nhập lý do hoàn tiền..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setRefundAppId(null); setRefundReason(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleRequestRefund}
                  disabled={actionLoading === "refund_" + refundAppId || !refundReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "refund_" + refundAppId ? "Đang gửi..." : "Xác nhận hoàn tiền"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }


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
              Quay lại danh sách
            </Link>

            {!isEmployer && isAuthenticated && <ScamAnalysisAlert jobId={job.id} />}


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
                    {job.postedBy ? `${job.postedBy.firstName} ${job.postedBy.lastName}` : `${job.employer.firstName} ${job.employer.lastName}`}
                    {job.employerProfile?.companyName ? ` - ${job.employerProfile.companyName}` : ''}
                  </span>
                  <span className="text-blue-200">|</span>
                  <span>{formatRelativeTime(job.createdAt)}</span>
                </div>
              </div>

              <div className="text-right">
                {job.jobType === JobType.ONLINE ? (
                  <>
                    <p className="text-3xl font-bold text-blue-600">
                      {job.onlinePaymentType === "FIXED_PRICE"
                        ? `${job.totalBudget?.toLocaleString("vi-VN")}đ`
                        : `${job.hourlyRateMin?.toLocaleString("vi-VN")}đ - ${job.hourlyRateMax?.toLocaleString("vi-VN")}đ`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {job.onlinePaymentType === "FIXED_PRICE" ? "Ngân sách cố định" : "Theo giờ"}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-blue-600">
                    {Number(job.salaryPerHour).toLocaleString("vi-VN")}đ
                    <span className="text-gray-400 font-normal">
                      /{job.salaryType === "FIXED" ? "công" : "giờ"}
                    </span>
                  </p>
                )}
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
              
              {/* Employer AI Match */}
              {isEmployer && (
                <MatchedCandidates job={job} />
              )}

              {/* Worker Progress */}
              {!isEmployer &&
                myApplication?.status === ApplicationStatus.ACCEPTED &&
                appProgress && (
                  <JobProgressInline
                    progress={appProgress}
                    escrow={escrow}
                    jobId={job.id}
                  />
                )}

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
                        {js.skill?.name}
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

              {/* Escrow Section for Online Jobs - only for FIXED_PRICE, not HOURLY_RATE */}
              {job.jobType === JobType.ONLINE && job.paymentMethod === PaymentMethod.ESCROW && job.onlinePaymentType !== "HOURLY_RATE" && (
                <EscrowSection job={job} />
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

              {/* P2P Bank Account Info */}
              {job.paymentMethod === PaymentMethod.P2P && (isEmployer || myApplication?.status === ApplicationStatus.ACCEPTED) && (
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🤝</span>
                    <h3 className="text-sm font-semibold text-blue-900">Thanh toán trực tiếp (P2P)</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-blue-700">Thông tin chuyển khoản để nhận tiền:</p>
                    {p2pBankAccounts.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                          ⚠ Bạn chưa cập nhật tài khoản ngân hàng.
                        </p>
                        <a href="/profile?section=bank" className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 transition-all w-full justify-center">
                          Thêm tài khoản ngay →
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {p2pBankAccounts.map(acc => (
                          <div key={acc.id} className="bg-white rounded-xl border border-blue-100 p-3 flex gap-3 items-start">
                            {acc.qrCodeUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={acc.qrCodeUrl} alt="QR" className="w-14 h-14 rounded-lg object-contain border border-gray-100 shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-2xl shrink-0">🏦</div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900">{acc.bankName}</p>
                              <p className="text-sm font-mono text-gray-800 mt-0.5">{acc.accountNumber}</p>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">{acc.accountName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Worker Complete Assignment */}
              {!isEmployer &&
                myApplication?.status === ApplicationStatus.ACCEPTED &&
                (appProgress?.assignment?.status === "IN_PROGRESS" || appProgress?.assignment?.status === "ASSIGNED") && (
                  <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm flex flex-col gap-3 mt-4">
                    {showWorkerCompleteConfirm ? (
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-sm text-emerald-800 mb-3 font-medium">
                          Xác nhận bạn đã hoàn tất công việc?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleWorkerComplete}
                            disabled={actionLoading === "complete"}
                            className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === "complete" ? "Đang xử lý..." : "Xác nhận"}
                          </button>
                          <button
                            onClick={() => setShowWorkerCompleteConfirm(false)}
                            disabled={actionLoading === "complete"}
                            className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Quay lại
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-700/80 text-center italic mt-3 leading-relaxed">
                          Lưu ý: Chỉ xác nhận hoàn thành khi bạn đã hoàn tất công việc{job?.paymentMethod === PaymentMethod.P2P ? " (và đã nhận đủ tiền nếu giao dịch trực tiếp)" : ""}.
                        </p>
                      </div>
                    ) : appProgress?.assignment?.status === "ASSIGNED" && job.jobType === JobType.GIG ? (
                      <button
                        onClick={handleCheckIn}
                        disabled={actionLoading === "checkIn"}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading === "checkIn" ? "Đang xử lý..." : "📍 Đã có mặt (Check-in)"}
                      </button>
                    ) : (job.jobType === JobType.ONLINE ? job.onlinePaymentType === "HOURLY_RATE" : job.salaryType === "HOURLY") ? (
                      <button
                        onClick={() => setShowLogHoursModal(true)}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:shadow-md transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>⏱️</span> Báo cáo số giờ làm
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowWorkerCompleteConfirm(true)}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-md transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>✅</span> Hoàn thành công việc
                      </button>
                    )}
                  </div>
                )}

              {/* Worker Hours Submitted Info */}
              {!isEmployer &&
                myApplication?.status === ApplicationStatus.ACCEPTED &&
                appProgress?.assignment?.status === "HOURS_SUBMITTED" && (
                  <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 shadow-sm mt-4 text-center">
                    <p className="text-sm font-semibold text-blue-800">
                      Đã báo cáo: <span className="text-xl mx-1">{appProgress.assignment.loggedHours}</span> giờ
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Đang chờ đối tác xác nhận số giờ làm này.</p>
                  </div>
                )}

              {/* Worker Payment Receipt Confirmation */}
              {!isEmployer &&
                myApplication?.status === ApplicationStatus.ACCEPTED &&
                appProgress?.assignment?.status === "PAYMENT_SENT" && (
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm mt-4">
                    {showConfirmReceipt ? (
                      <div className="bg-white p-4 rounded-xl border border-emerald-100">
                        <p className="text-sm text-emerald-800 mb-3 font-medium">
                          Bạn chắc chắn đã nhận đủ tiền chứ?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleWorkerConfirmReceipt}
                            disabled={actionLoading === "confirmReceipt"}
                            className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === "confirmReceipt" ? "Đang xử lý..." : "Xác nhận"}
                          </button>
                          <button
                            onClick={() => setShowConfirmReceipt(false)}
                            disabled={actionLoading === "confirmReceipt"}
                            className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Quay lại
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setShowConfirmReceipt(true)}
                          className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-md transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          Xác nhận đã nhận đủ thanh toán
                        </button>
                        {!isEmployer && job?.paymentMethod !== PaymentMethod.ESCROW && (
                          <p className="text-[11px] text-emerald-700/80 text-center italic mt-1 leading-relaxed">
                            Lưu ý: Bạn chỉ được bấm xác nhận này khi thực tế đã nhận được tiền.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Final Payment Confirmation - only after job completed */}
              {(job.status === JobStatus.COMPLETED || job.status === JobStatus.SETTLED) && job.jobType !== JobType.ONLINE && (isEmployer || myApplication?.status === ApplicationStatus.ACCEPTED) && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
                  <h3 className="text-sm font-semibold text-emerald-800 mb-2">
                    Xác nhận thanh toán
                  </h3>
                  {!isConfirmedByMe ? (
                    <div className="w-full">
                      <button
                        onClick={handleConfirmPayment}
                        disabled={actionLoading === "payment"}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all"
                      >
                        {actionLoading === "payment"
                          ? "Đang xử lý..."
                          : isEmployer ? "Xác nhận đã thanh toán" : (job.paymentMethod === PaymentMethod.P2P ? "Xác nhận đã nhận đủ thanh toán" : "Xác nhận hoàn thành")}
                      </button>
                      {!isEmployer && job.paymentMethod === PaymentMethod.P2P && (
                        <p className="text-[11px] text-emerald-700/80 text-center italic mt-2 leading-relaxed">
                          Lưu ý: Bạn chỉ được bấm xác nhận này khi thực tế đã nhận được tiền.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Bạn đã xác nhận
                      </p>
                      {!isFullyConfirmed && (
                        <p className="text-xs text-emerald-600/70">
                          Chờ {isEmployer ? "người làm" : "người thuê"} xác nhận để hoàn tất...
                        </p>
                      )}
                      {isFullyConfirmed && (
                        <p className="text-xs font-bold text-emerald-700">
                          ✓ Giao dịch hoàn tất
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dispute option - Available to involved parties before settlement */}
              {(isEmployer || myApplication?.status === ApplicationStatus.ACCEPTED) && !hasOpenDispute && job.status !== JobStatus.SETTLED && job.status !== JobStatus.CANCELLED && (
                <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm mt-4">
                  {!showDisputeForm ? (
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Có vấn đề? Tạo khiếu nại
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-red-800">Tạo khiếu nại</h3>
                      <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                        className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateDispute}
                          disabled={actionLoading === "dispute" || !disputeReason.trim()}
                          className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm"
                        >
                          {actionLoading === "dispute" ? "Đang gửi..." : "Gửi khiếu nại"}
                        </button>
                        <button
                          onClick={() => {
                            setShowDisputeForm(false);
                            setDisputeReason("");
                          }}
                          disabled={actionLoading === "dispute"}
                          className="flex-1 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
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
                            (isEmployer ? p.confirmedByWorker : p.confirmedByEmployer)
                              ? "text-emerald-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {(isEmployer ? p.confirmedByWorker : p.confirmedByEmployer)
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
                        {myApplication.status ===
                          ApplicationStatus.EMPLOYER_ACCEPTED && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleRespondAcceptance(false)}
                              disabled={actionLoading === myApplication.id}
                              className="w-full py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-all"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleRespondAcceptance(true)}
                              disabled={actionLoading === myApplication.id}
                              className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all"
                            >
                              Xác nhận làm việc
                            </button>
                          </div>
                        )}
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
                  {job.jobType !== JobType.ONLINE && job.paymentMethod !== PaymentMethod.ESCROW && (
                    <button
                      onClick={() => setShowCompleteConfirm(true)}
                      disabled={actionLoading === "complete"}
                      className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all"
                    >
                      Hoàn thành công việc
                    </button>
                  )}
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
              {!isEmployer && job.jobType !== JobType.ONLINE && job.salaryType === "HOURLY" && (
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
                          {job.category?.icon} {job.category?.name}
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
                  {job.startTime ? (
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
                        {job.endTime && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            đến {formatDateTime(job.endTime)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : job.deadline ? (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="text-xs text-gray-400">Deadline</p>
                        <p className="text-sm text-gray-700 font-medium">
                          {formatDateTime(job.deadline)}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Location */}
                  {job.jobType !== JobType.ONLINE && (
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
                  )}
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
                    <Link
                      href={
                        job.employer.role === "ORGANIZATION" || job.employer.role === "RECRUITER"
                          ? `/employer/${job.employerId}`
                          : `/users/${job.employerId}`
                      }
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {job.employerProfile?.companyName || `${job.employer.firstName} ${job.employer.lastName}`}
                    </Link>
                    <p className="text-xs text-gray-400">Nhà tuyển dụng</p>
                  </div>
                </div>
              </div>

              {/* AI Scam Check & Save */}
              {!isEmployer && isAuthenticated && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5">
                  <div className="space-y-2">
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

      {/* Confirmation Modals */}

      <ConfirmModal
        isOpen={showWorkerCompleteConfirm}
        onClose={() => setShowWorkerCompleteConfirm(false)}
        onConfirm={handleWorkerComplete}
        title="Hoàn thành công việc"
        message="Xác nhận rằng bạn đã hoàn tất công việc?"
        confirmLabel="Xác nhận"
        variant="success"
        isLoading={actionLoading === "complete"}
      />

      {/* Log Hours Modal */}
      {showLogHoursModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Báo cáo số giờ làm</h3>
              <p className="text-sm text-gray-500 mb-6">Nhập tổng số giờ bạn đã làm cho công việc này. Đối tác sẽ cần xác nhận trước khi thanh toán.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số giờ đã làm</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={loggedHoursInput}
                    onChange={(e) => setLoggedHoursInput(e.target.value)}
                    placeholder="VD: 8.5"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-900"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">giờ</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogHoursModal(false)}
                  disabled={actionLoading === "logHours"}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (Number(loggedHoursInput) > 0) {
                      handleLogHours(Number(loggedHoursInput));
                    }
                  }}
                  disabled={!loggedHoursInput || Number(loggedHoursInput) <= 0 || actionLoading === "logHours"}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "logHours" ? "Đang xử lý..." : "Gửi báo cáo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
