"use client";

import { cn } from "@/lib/utils";
import { JobStatus, ApplicationStatus } from "@/types";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const jobStatusConfig: Record<JobStatus, { label: string; className: string }> =
  {
    [JobStatus.OPEN]: {
      label: "Đang tuyển",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    [JobStatus.CLOSED]: {
      label: "Đã đóng",
      className: "bg-gray-50 text-gray-600 border-gray-200",
    },
    [JobStatus.CANCELLED]: {
      label: "Đã huỷ",
      className: "bg-red-50 text-red-600 border-red-200",
    },
  };

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = jobStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.className,
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === JobStatus.OPEN && "bg-emerald-500",
          status === JobStatus.CLOSED && "bg-gray-400",
          status === JobStatus.CANCELLED && "bg-red-500",
        )}
      />
      {config.label}
    </span>
  );
}

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const appStatusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  [ApplicationStatus.PENDING]: {
    label: "Chờ duyệt",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [ApplicationStatus.ACCEPTED]: {
    label: "Đã chấp nhận",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [ApplicationStatus.REJECTED]: {
    label: "Đã từ chối",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  [ApplicationStatus.CANCELLED]: {
    label: "Đã huỷ",
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
};

export function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  const config = appStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
