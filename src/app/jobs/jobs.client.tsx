"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { JobCard } from "@/components/job/job-card";
import { JobFilters } from "@/components/job/job-filters";
import { jobService } from "@/services";
import { Job, JobFilterParams, PaginationMeta } from "@/types";

export default function JobsPageClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState<JobFilterParams>({});
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(
    async (pageNum: number, currentFilters: JobFilterParams) => {
      setIsLoading(true);
      try {
        const res = await jobService.findJobs({
          ...currentFilters,
          page: pageNum,
          limit: 12,
        });
        setJobs(res.data);
        setPagination(res.meta?.pagination || null);
      } catch {
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchJobs(page, filters);
  }, [page, filters, fetchJobs]);

  const handleFilterChange = useCallback(
    (newFilters: Omit<JobFilterParams, "page" | "limit">) => {
      setPage(1);
      setFilters(newFilters);
    },
    [],
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen">
        {/* Page Header */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-white border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Tìm kiếm <span className="text-blue-600">việc làm</span>
            </h1>
            <p className="mt-2 text-gray-500">
              Khám phá hàng ngàn công việc thời vụ phù hợp với bạn
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          <div className="mb-6">
            <JobFilters onFilterChange={handleFilterChange} />
          </div>

          {/* Results Count */}
          {pagination && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Tìm thấy{" "}
                <span className="font-semibold text-gray-900">
                  {pagination.total}
                </span>{" "}
                công việc
              </p>
            </div>
          )}

          {/* Job Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-blue-100 p-5 animate-pulse"
                >
                  <div className="flex justify-between mb-3">
                    <div className="flex-1">
                      <div className="h-5 bg-blue-50 rounded-lg w-3/4 mb-2" />
                      <div className="h-3 bg-blue-50 rounded w-1/2" />
                    </div>
                    <div className="h-6 w-20 bg-blue-50 rounded-full" />
                  </div>
                  <div className="h-3 bg-blue-50 rounded w-20 mb-3" />
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-blue-50 rounded w-full" />
                    <div className="h-3 bg-blue-50 rounded w-2/3" />
                  </div>
                  <div className="border-t border-blue-50 pt-3">
                    <div className="h-4 bg-blue-50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
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
                Không tìm thấy công việc
              </h3>
              <p className="text-gray-500 text-sm">
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khoá khác
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={!pagination.hasPrevious}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Trước
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (pagination.totalPages <= 7) return true;
                  if (p === 1 || p === pagination.totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                          p === page
                            ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                            : "text-gray-600 hover:bg-blue-50"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}

              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
