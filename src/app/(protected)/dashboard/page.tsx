"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth-guard";
import { JobStatusBadge, ApplicationStatusBadge } from "@/components/job";
import { useAuth, useChat } from "@/contexts";
import { jobService } from "@/services";
import { Job, JobApplication, ApplicationStatus } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

type Tab = "posted" | "applied";

export default function DashboardPage() {
  const { user } = useAuth();
  const { openChat } = useChat();
  const [activeTab, setActiveTab] = useState<Tab>("posted");
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [workerHistory, setWorkerHistory] = useState<JobApplication[]>([]);
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
        } else {
          const data = await jobService.getWorkerHistory();
          if (!cancelled) setWorkerHistory(data);
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
            <>
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
            </>
          ) : (
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
          )}
        </div>
      </main>
      <Footer />
    </AuthGuard>
  );
}
