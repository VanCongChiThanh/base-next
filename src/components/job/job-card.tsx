"use client";

import Link from "next/link";
import { Job, JobStatus, EmployerBadge } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { JobStatusBadge } from "./status-badge";

interface JobCardProps {
  job: Job;
}

const badgeConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  [EmployerBadge.TOP]: {
    label: "Top",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: "👑",
  },
  [EmployerBadge.TRUSTED]: {
    label: "Uy tín",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: "⭐",
  },
  [EmployerBadge.VERIFIED]: {
    label: "Đã xác thực",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: "✓",
  },
};

export function JobCard({ job }: JobCardProps) {
  const isOpen = job.status === JobStatus.OPEN;
  const profile = job.employerProfile;
  const badge =
    profile?.badge && profile.badge !== EmployerBadge.NONE
      ? badgeConfig[profile.badge]
      : null;

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300 h-full flex flex-col relative">
        {/* Trust Badges */}
        {(badge || profile?.isVerifiedBusiness) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {badge && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}
              >
                {badge.icon} {badge.label}
              </span>
            )}
            {profile?.isVerifiedBusiness && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-300">
                🏢 Tổ chức xác thực
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {profile?.companyName ||
                `${job.employer.firstName} ${job.employer.lastName}`}
              {profile && profile.totalReviews > 0 && (
                <span className="ml-2 text-xs text-amber-500">
                  ★ {Number(profile.ratingAvg).toFixed(1)} (
                  {profile.totalReviews})
                </span>
              )}
              {profile && profile.totalJobsPosted > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  · {profile.totalJobsPosted} việc đã đăng
                </span>
              )}
            </p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {/* Category */}
        {job.category && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
              {job.category.icon && (
                <span className="mr-1">{job.category.icon}</span>
              )}
              {job.category.name}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
          {job.description}
        </p>

        {/* Skills */}
        {job.jobSkills && job.jobSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.jobSkills.slice(0, 3).map((js) => (
              <span
                key={js.id}
                className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-xs font-medium"
              >
                {js.skill.name}
              </span>
            ))}
            {job.jobSkills.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-xs">
                +{job.jobSkills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="border-t border-blue-50 pt-3 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-base font-bold text-blue-600">
                {Number(job.salaryPerHour).toLocaleString("vi-VN")}đ
              </span>
              <span className="text-xs text-gray-400">
                /{job.salaryType === "FIXED" ? "công" : "giờ"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
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
              <span className="text-xs">
                {formatRelativeTime(job.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-gray-500">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs truncate max-w-[150px]">
                {job.address}
              </span>
            </div>
            {job.distance !== undefined && (
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-[10px] font-bold">
                  Cách bạn {job.distance < 1 ? `${(job.distance * 1000).toFixed(0)}m` : `${job.distance.toFixed(1)}km`}
                </span>
              </div>
            )}
            {isOpen && (
              <span className="text-xs text-blue-500 font-medium">
                Cần {job.requiredWorkers} người
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
