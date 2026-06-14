"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth-guard";
import { JobStatusBadge, ApplicationStatusBadge } from "@/components/job";
import { UpgradePrompt } from "@/components/common/upgrade-prompt";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { BankAccountReminder } from "@/components/profile";
import { useAuth, useChat } from "@/contexts";
import { jobService, paymentService, workerServiceAPI } from "@/services";
import { Job, JobApplication, ApplicationStatus, Milestone, WorkerService } from "@/types";
import { MilestoneStatus } from "@/types/enums";
import { formatRelativeTime } from "@/lib/utils";

import { toast } from "react-hot-toast";

type Tab = "posted" | "applied" | "invitations" | "payments" | "services";

type Invitation = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | string;
  jobId: string;
  createdAt: string;
  job?: {
    title?: string;
  };
  employer?: {
    firstName?: string;
    lastName?: string;
  };
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { openChat } = useChat();
  const [activeTab, setActiveTab] = useState<Tab>("posted");
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [workerHistory, setWorkerHistory] = useState<JobApplication[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [paymentMilestones, setPaymentMilestones] = useState<Milestone[]>([]);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [myServices, setMyServices] = useState<WorkerService[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [loadingTab, setLoadingTab] = useState<Tab | null>("posted");
  const isLoading = loadingTab === activeTab;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingTab(activeTab);
      try {
        if (activeTab === "posted") {
          const data = await jobService.getMyJobs();
          if (!cancelled) setMyJobs(data);
        } else if (activeTab === "applied") {
          const data = await jobService.getWorkerHistory();
          if (!cancelled) setWorkerHistory(data);
        } else if (activeTab === "invitations") {
          const data = await jobService.getMyInvitations();
          if (!cancelled) setInvitations(data);
        } else if (activeTab === "payments") {
          const data = await paymentService.getWorkerMilestones(1, 20);
          if (!cancelled) {
            setPaymentMilestones(data?.data ?? []);
            setPaymentTotal(data?.total ?? 0);
          }
        } else if (activeTab === "services") {
          const data = await workerServiceAPI.getMyServices();
          if (!cancelled) setMyServices(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingTab(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleRespondInvitation = async (id: string, accept: boolean) => {
    try {
      await jobService.respondToInvitation(id, accept);
      toast.success(accept ? "Đã chấp nhận lời mời!" : "Đã từ chối lời mời");
      // Refresh
      const data = await jobService.getMyInvitations();
      setInvitations(data);
    } catch {
      toast.error("Không thể phản hồi lời mời");
    }
  };

  const handleRespondAcceptance = async (applicationId: string, accept: boolean) => {
    try {
      await jobService.respondApplicationAcceptance(applicationId, accept);
      toast.success(accept ? "Đã xác nhận nhận việc!" : "Đã từ chối nhận việc");
      const data = await jobService.getWorkerHistory();
      setWorkerHistory(data);
    } catch {
      toast.error("Không thể phản hồi xác nhận việc");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeletingService(true);
    try {
      await workerServiceAPI.deleteService(deleteConfirmId);
      toast.success("Đã xóa dịch vụ thành công");
      const data = await workerServiceAPI.getMyServices();
      setMyServices(data);
    } catch {
      toast.error("Không thể xóa dịch vụ");
    } finally {
      setIsDeletingService(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-white border-b border-blue-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Xin chào,{" "}
              <span className="text-blue-600">
                {user?.firstName} {user?.lastName}
              </span>
            </h1>
            <p className="mt-2 text-gray-500">
              Quản lý công việc và lịch sử ứng tuyển
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {user?.role === "USER" && <BankAccountReminder />}
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-blue-50/50 rounded-2xl p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab("posted")}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "posted"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              Việc đã đăng
            </button>
            <button
              onClick={() => setActiveTab("applied")}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "applied"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              Lịch sử ứng tuyển
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "invitations"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              Lời mời việc làm {invitations.filter(i => i.status === 'PENDING').length > 0 && <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">{invitations.filter(i => i.status === 'PENDING').length}</span>}
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "payments"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              Tài chính
            </button>
            {user?.role !== "ORGANIZATION" && (
              <button
                onClick={() => setActiveTab("services")}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "services"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                Dịch vụ của tôi
              </button>
            )}
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-blue-100 p-5 animate-pulse"
                >
                  <div className="h-5 bg-blue-50 rounded-lg w-1/3 mb-3" />
                  <div className="h-3 bg-blue-50 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-blue-50 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : activeTab === "posted" ? (
            /* My Posted Jobs */
            <div className="space-y-6">
              <UpgradePrompt />
              {myJobs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
                    <svg
                      className="w-8 h-8 text-blue-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Chưa có bài đăng nào
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Bắt đầu đăng tuyển để tìm ứng viên phù hợp
                  </p>
                  <Link
                    href="/jobs/post"
                    className="inline-flex px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all"
                  >
                    Đăng việc mới
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:shadow-blue-50 hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {job.title}
                            </h3>
                            <JobStatusBadge status={job.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            {job.category && (
                              <span>
                                {job.category.icon} {job.category.name}
                              </span>
                            )}
                            <span className="text-blue-200">|</span>
                            <span>
                              {Number(job.salaryPerHour).toLocaleString(
                                "vi-VN",
                              )}
                              đ/giờ
                            </span>
                            <span className="text-blue-200">|</span>
                            <span>Cần {job.requiredWorkers} người</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Đăng {formatRelativeTime(job.createdAt)}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-300 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "applied" ? (
            /* Worker History */
            <>
              {workerHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
                    <svg
                      className="w-8 h-8 text-blue-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Chưa có lịch sử ứng tuyển
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Tìm và ứng tuyển việc làm phù hợp với bạn
                  </p>
                  <Link
                    href="/jobs"
                    className="inline-flex px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all"
                  >
                    Tìm việc
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {workerHistory.map((app) => (
                    <Link
                      key={app.id}
                      href={app.job ? `/jobs/${app.job.id}` : "#"}
                      className="block bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:shadow-blue-50 hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {app.job?.title || "Công việc"}
                            </h3>
                            <ApplicationStatusBadge status={app.status} />
                          </div>
                          {app.coverLetter && (
                            <p className="text-sm text-gray-500 line-clamp-1 mb-1">
                              {app.coverLetter}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Ứng tuyển {formatRelativeTime(app.appliedAt)}
                            {app.respondedAt &&
                              ` · Phản hồi ${formatRelativeTime(app.respondedAt)}`}
                          </p>
                          {app.status === ApplicationStatus.EMPLOYER_ACCEPTED && (
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRespondAcceptance(app.id, false);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all border border-red-100"
                              >
                                Từ chối
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRespondAcceptance(app.id, true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-all border border-emerald-100"
                              >
                                Xác nhận nhận việc
                              </button>
                            </div>
                          )}
                          {app.status === ApplicationStatus.ACCEPTED && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openChat(
                                  app.id,
                                  app.status as ApplicationStatus,
                                  app.job?.title,
                                );
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all border border-blue-100"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m-7 7 4.684-4.684A2 2 0 0111.1 15.9H17a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v13z" />
                              </svg>
                              Chat
                            </button>
                          )}
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-300 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === "payments" ? (
            /* Payment milestones */
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Quản lý giải ngân Escrow
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Mọi milestone hoặc giao dịch Escrow của bạn sẽ hiện ở đây để tiện theo dõi.
                  </p>
                </div>
                <Link
                  href="/payments"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                >
                  Xem trang tài chính
                </Link>
              </div>

              {paymentMilestones.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4 text-3xl">
                    💰
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Chưa có giao dịch Escrow nào
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Khi admin giải ngân hoặc milestone có cập nhật thanh toán, thông tin sẽ xuất hiện ở đây.
                  </p>
                  <Link
                    href="/jobs"
                    className="inline-flex px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all"
                  >
                    Tìm việc
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMilestones.map((milestone) => {
                    const isReleased = milestone.status === MilestoneStatus.RELEASED;
                    const hasConfirmed = !!milestone.workerReceivedAt;

                    return (
                      <Link
                        key={milestone.id}
                        href={milestone.escrow?.jobId ? `/jobs/${milestone.escrow.jobId}` : "/payments"}
                        className="block bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:shadow-blue-50 hover:border-blue-200 transition-all"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-semibold text-gray-900">
                                {milestone.title}
                              </h3>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isReleased
                                    ? hasConfirmed
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {isReleased
                                  ? hasConfirmed
                                    ? "Đã xác nhận nhận tiền"
                                    : "Admin đã giải ngân"
                                  : milestone.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {milestone.escrow?.job?.title ?? "Công việc Escrow"}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {milestone.releasedAt
                                ? `Giải ngân ${formatRelativeTime(milestone.releasedAt)}`
                                : `Tạo ${formatRelativeTime(milestone.createdAt)}`}
                            </p>
                            {isReleased && !hasConfirmed && (
                              <p className="mt-2 text-xs font-medium text-amber-600">
                                Admin đã bấm giải ngân, vui lòng vào chi tiết công việc hoặc trang tài chính để xác nhận khi đã nhận tiền.
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {Number(milestone.amount).toLocaleString("vi-VN")}đ
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {hasConfirmed ? "Hoàn tất" : "Đang theo dõi"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {paymentTotal > paymentMilestones.length && (
                    <div className="pt-2 text-center">
                      <Link
                        href="/payments"
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Xem tất cả {paymentTotal} milestone →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : activeTab === "services" ? (
            /* My Services */
            <div className="space-y-6">
              {myServices.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
                    <svg
                      className="w-8 h-8 text-blue-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Chưa có dịch vụ nào
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Bắt đầu đăng "Thuê tôi" để khách hàng dễ dàng tìm thấy bạn
                  </p>
                  <Link
                    href="/services/new"
                    className="inline-flex px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all"
                  >
                    Đăng Thuê Tôi
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myServices.map((service) => (
                    <div
                      key={service.id}
                      className="block bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:shadow-blue-50 hover:border-blue-200 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/services/${service.id}`} className="text-base font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                              {service.title}
                            </Link>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${service.isAvailableNow ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                              {service.isAvailableNow ? 'Sẵn sàng ngay' : 'Đang bận'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-1">
                            {service.category && (
                              <span>
                                {service.category.icon} {service.category.name}
                              </span>
                            )}
                            <span className="text-blue-200">|</span>
                            <span>
                              {Number(service.price).toLocaleString("vi-VN")}đ{service.priceType === 'HOURLY' ? '/giờ' : '/dịch vụ'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Đăng {formatRelativeTime(service.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteConfirmId(service.id);
                          }}
                          className="w-full sm:w-auto text-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm rounded-xl transition-colors flex-shrink-0"
                        >
                          Xóa / Gỡ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Invitations */
            <>
              {invitations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
                    <svg className="w-8 h-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Chưa có lời mời nào
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Khi nhà tuyển dụng mời bạn làm việc, lời mời sẽ xuất hiện ở đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="block bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:shadow-blue-50 hover:border-blue-200 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {inv.job?.title || "Công việc"}
                            </h3>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                              inv.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              inv.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {inv.status === 'PENDING' ? 'Đang chờ' :
                               inv.status === 'ACCEPTED' ? 'Đã nhận' : 'Đã từ chối'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Người mời: <span className="font-medium">{inv.employer?.firstName} {inv.employer?.lastName}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Nhận {formatRelativeTime(inv.createdAt)}
                          </p>
                        </div>
                        {inv.status === 'PENDING' && (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleRespondInvitation(inv.id, true)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium text-sm rounded-xl transition-colors"
                            >
                              Nhận việc
                            </button>
                            <button
                              onClick={() => handleRespondInvitation(inv.id, false)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm rounded-xl transition-colors"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                        {inv.status === 'ACCEPTED' && (
                          <Link
                            href={`/jobs/${inv.jobId}`}
                            className="w-full sm:w-auto text-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm rounded-xl transition-colors"
                          >
                            Xem công việc
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa dịch vụ"
        message="Bạn có chắc chắn muốn xóa/gỡ dịch vụ này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa dịch vụ"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={isDeletingService}
      />
    </AuthGuard>
  );
}
