"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSavedJobs, unsaveJob } from "@/services/ai.service";
import type { Job } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchJobs = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = (await getSavedJobs(p, 12)) as { data: Job[]; total: number };
      setJobs(res.data || []);
      setTotal(res.total || 0);
      setPage(p);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setTotal((prev) => prev - 1);
    } catch {}
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-amber-500">★</span>
              Công việc đã lưu
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {total} công việc đã được lưu
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-blue-100 p-5 animate-pulse"
                >
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-8 bg-gray-100 rounded w-1/3 mt-4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && jobs.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl opacity-40">☆</span>
              </div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Chưa có công việc nào được lưu
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Bạn có thể lưu các công việc yêu thích để xem lại sau.
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
              >
                Tìm việc ngay
              </Link>
            </div>
          )}

          {/* Job List */}
          {!isLoading && jobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:shadow-blue-50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition line-clamp-2 text-sm leading-snug"
                    >
                      {job.title}
                    </Link>
                    <button
                      onClick={() => handleUnsave(job.id)}
                      className="flex-shrink-0 ml-2 text-amber-500 hover:text-gray-400 transition"
                      title="Bỏ lưu"
                    >
                      ★
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mb-2">
                    {job.employer?.firstName} {job.employer?.lastName} ·{" "}
                    {formatRelativeTime(job.createdAt)}
                  </p>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-bold text-sm">
                      {Number(job.salaryPerHour).toLocaleString("vi-VN")}đ
                      <span className="text-gray-400 font-normal text-xs">
                        /{job.salaryType === "FIXED" ? "công" : "giờ"}
                      </span>
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium transition"
                    >
                      Chi tiết →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 12 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => fetchJobs(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Trước
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                Trang {page} / {Math.ceil(total / 12)}
              </span>
              <button
                onClick={() => fetchJobs(page + 1)}
                disabled={page >= Math.ceil(total / 12)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
