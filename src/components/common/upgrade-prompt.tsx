"use client";

import { useState } from "react";
import Link from "next/link";
import { useEntitlements } from "@/contexts";

/**
 * A smart upgrade banner that only shows when the user is approaching
 * or has exceeded their posting quota. Renders nothing when quota is healthy.
 */
export function UpgradePrompt() {
  const { entitlements, usage, isLoading } = useEntitlements();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed || !entitlements) return null;

  // Check posting quota
  const maxPosts = entitlements.features?.["job.post.max_open_jobs"];
  if (typeof maxPosts !== "number") return null;

  // Find current month usage for job posts
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const postUsage = usage.find(
    (u) => u.featureKey === "job.post" && u.periodKey === currentPeriod,
  );
  const usedPosts = postUsage?.count ?? 0;
  const remaining = Math.max(0, maxPosts - usedPosts);
  const percentage = maxPosts > 0 ? (usedPosts / maxPosts) * 100 : 0;

  // Only show when 80%+ used
  if (percentage < 80) return null;

  const isExhausted = remaining <= 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
        isExhausted
          ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
          : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
      }`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <svg viewBox="0 0 24 24" fill="currentColor" className={isExhausted ? "text-red-900" : "text-amber-900"}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isExhausted
              ? "bg-red-100 text-red-600"
              : "bg-amber-100 text-amber-600"
          }`}
        >
          {isExhausted ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${
              isExhausted ? "text-red-800" : "text-amber-800"
            }`}
          >
            {isExhausted
              ? "Bạn đã hết lượt đăng tin trong tháng này"
              : `Sắp hết lượt đăng tin — còn ${remaining} lượt`}
          </h3>
          <p
            className={`text-sm mt-0.5 ${
              isExhausted ? "text-red-600/80" : "text-amber-600/80"
            }`}
          >
            {isExhausted
              ? "Nâng cấp gói dịch vụ để tiếp tục đăng tin tuyển dụng."
              : "Nâng cấp để đăng thêm tin và tiếp cận nhiều ứng viên hơn."}
          </p>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExhausted
                    ? "bg-gradient-to-r from-red-400 to-red-500"
                    : "bg-gradient-to-r from-amber-400 to-amber-500"
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                isExhausted ? "text-red-700" : "text-amber-700"
              }`}
            >
              {usedPosts}/{maxPosts}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/pricing"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              isExhausted
                ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-md"
                : "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-md"
            }`}
          >
            Nâng cấp ngay
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-white/60 transition-colors"
            title="Ẩn thông báo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
