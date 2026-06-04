"use client";

import { ApplicationProgress, Escrow, MilestoneStatus } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { Fragment } from "react";

interface Props {
  progress: ApplicationProgress;
  escrow?: Escrow | null;
  jobId: string;
}

const STEP_ICONS: Record<string, string> = {
  APPLIED: "📋",
  REVIEWING: "🔍",
  ACCEPTED: "✅",
  CHECKED_IN: "📍",
  IN_PROGRESS: "⚡",
  COMPLETED: "🏆",
};

export function JobProgressInline({ progress, escrow, jobId }: Props) {
  // Combine progress steps and escrow milestones
  const displayNodes = progress.steps.flatMap((step) => {
    if ((step.key === "IN_PROGRESS" || step.key === "MILESTONES") && escrow && escrow.milestones && escrow.milestones.length > 0) {
      return escrow.milestones.map((m, idx) => {
        // Determine status of milestone
        let mStatus: "done" | "active" | "pending" | "failed" = "pending";
        if (m.status === MilestoneStatus.RELEASED) {
          mStatus = "done";
        } else if (
          m.status === MilestoneStatus.IN_PROGRESS ||
          m.status === MilestoneStatus.SUBMITTED ||
          m.status === MilestoneStatus.REVISION_REQUESTED ||
          m.status === MilestoneStatus.APPROVED
        ) {
          mStatus = "active";
        } else if (m.status === MilestoneStatus.DISPUTED) {
          mStatus = "failed";
        }

        return {
          key: `MILESTONE_${m.id}`,
          label: m.title,
          status: step.status === "pending" ? "pending" : step.status === "done" ? "done" : mStatus,
          isMilestone: true,
          amount: m.amount,
          icon: "💎",
          timestamp: undefined, // Optionally add timestamp if we have it
        };
      });
    }

    return [
      {
        key: step.key,
        label: step.label,
        status: step.status,
        isMilestone: false,
        amount: 0,
        icon: STEP_ICONS[step.key] || "•",
        timestamp: step.timestamp,
      },
    ];
  });

  const completedCount = displayNodes.filter((n) => n.status === "done").length;
  const progressPercent = Math.round((completedCount / displayNodes.length) * 100);

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
              <h3 className="text-sm font-bold text-gray-900">Tiến trình Công việc</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {completedCount}/{displayNodes.length} bước hoàn thành
              </p>
            </div>
          </div>
          {escrow && (
            <Link
              href={`/jobs/${jobId}/escrow`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-100/50 transition-colors"
            >
              Chi tiết Ký quỹ
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                progressPercent === 100
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-blue-600 to-sky-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-right text-[11px] font-semibold mt-1">
            <span className={progressPercent === 100 ? "text-emerald-600" : "text-blue-600"}>{progressPercent}%</span>
          </p>
        </div>
      </div>

      {/* Horizontal Stepper */}
      <div className="px-3 sm:px-6 py-6 overflow-x-auto">
        <div className="flex items-start" style={{ minWidth: `${Math.max(displayNodes.length * 140, 300)}px` }}>
          {displayNodes.map((node, i) => {
            const isLast = i === displayNodes.length - 1;
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
                line: "bg-gradient-to-r from-blue-400 to-gray-200",
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
            const s = statusStyles[node.status as keyof typeof statusStyles] || statusStyles.pending;

            return (
              <Fragment key={node.key}>
                <div className="flex flex-col items-center w-32 shrink-0 relative">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg shadow-sm transition-all duration-500 z-10 bg-white ${s.circle}`}
                  >
                    <span className={s.icon}>
                      {node.status === "done" ? "✓" : node.status === "failed" ? "✗" : node.icon}
                    </span>
                  </div>
                  <div className="mt-3 text-center px-1">
                    <p className={`text-xs transition-colors duration-300 ${s.label} line-clamp-2`}>
                      {node.label}
                    </p>
                    {node.isMilestone && node.amount > 0 && (
                      <p className="text-[10px] text-gray-500 font-medium mt-1">
                        {node.amount.toLocaleString("vi-VN")}đ
                      </p>
                    )}
                    {node.timestamp && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(new Date(node.timestamp), "dd/MM", { locale: vi })}
                      </p>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div className="flex-1 min-w-[30px] pt-5 -ml-4 -mr-4 z-0">
                    <div className={`h-1 w-full transition-all duration-700 ${s.line}`} />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
