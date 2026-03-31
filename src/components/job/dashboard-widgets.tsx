"use client";

import { JobApplication } from "@/types";
import { format, isPast, isFuture, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ApplicationStatus } from "@/types/enums";

interface QuickStatsProps {
  applications: JobApplication[];
  totalJobsCompleted?: number;
  ratingAvg?: number;
}

export function WorkerQuickStats({ applications, totalJobsCompleted = 0, ratingAvg = 0 }: QuickStatsProps) {
  const pending = applications.filter(a => a.status === ApplicationStatus.PENDING).length;
  const accepted = applications.filter(a => a.status === ApplicationStatus.ACCEPTED).length;
  const completed = applications.filter(a => a.status === "ACCEPTED").length; // as proxy
  const acceptRate = applications.length > 0 ? Math.round((accepted / applications.length) * 100) : 0;

  const stats = [
    { label: "Đang chờ", value: pending, icon: "⏳", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Được chấp nhận", value: accepted, icon: "✅", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Tỷ lệ accept", value: `${acceptRate}%`, icon: "📊", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Việc hoàn thành", value: totalJobsCompleted, icon: "🏆", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-xl border p-4 ${s.bg} transition-all duration-200 hover:scale-[1.02]`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{s.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
        </div>
      ))}
      {ratingAvg > 0 && (
        <div className="col-span-2 lg:col-span-4 rounded-xl border bg-amber-500/5 border-amber-500/20 p-3 flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`text-lg ${i <= Math.round(ratingAvg) ? "text-amber-400" : "text-slate-700"}`}>★</span>
            ))}
          </div>
          <div>
            <span className="text-amber-400 font-bold">{Number(ratingAvg).toFixed(1)}</span>
            <span className="text-slate-500 text-xs ml-2">Đánh giá trung bình của bạn</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface UpcomingShiftsProps {
  applications: (JobApplication & { job: NonNullable<JobApplication["job"]> })[];
  onCheckIn?: (jobId: string) => void;
}

export function UpcomingShiftsWidget({ applications, onCheckIn }: UpcomingShiftsProps) {
  const upcoming = applications
    .filter((a) => a.status === ApplicationStatus.ACCEPTED && a.job && isFuture(new Date(a.job.startTime)))
    .sort((a, b) => new Date(a.job.startTime).getTime() - new Date(b.job.startTime).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🗓️</span>
        <h3 className="text-white font-semibold text-sm">Ca làm việc sắp tới</h3>
        <span className="ml-auto text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
          {upcoming.length} ca
        </span>
      </div>
      <div className="space-y-3">
        {upcoming.map((app) => {
          const start = new Date(app.job.startTime);
          const isClose = start.getTime() - Date.now() < 2 * 3600 * 1000; // within 2 hours
          return (
            <div
              key={app.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isClose
                  ? "bg-amber-900/20 border-amber-700/40"
                  : "bg-slate-800/40 border-slate-700/40"
              }`}
            >
              <div className={`w-2 h-10 rounded-full shrink-0 ${isClose ? "bg-amber-400" : "bg-violet-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{app.job.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {format(start, "HH:mm - dd/MM/yyyy", { locale: vi })}
                  {" · "}
                  <span className={isClose ? "text-amber-400" : "text-slate-500"}>
                    {formatDistanceToNow(start, { addSuffix: true, locale: vi })}
                  </span>
                </p>
              </div>
              {isClose && onCheckIn && (
                <button
                  onClick={() => onCheckIn(app.jobId)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                >
                  Check-in
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ApplicantPipelineProps {
  applications: JobApplication[];
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}

const PIPELINE_STAGES = [
  { key: ApplicationStatus.PENDING, label: "Chờ duyệt", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { key: ApplicationStatus.ACCEPTED, label: "Đã chấp nhận", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  { key: ApplicationStatus.REJECTED, label: "Từ chối", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" },
];

export function ApplicantPipelineWidget({ applications, onAccept, onReject }: ApplicantPipelineProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">👥</span>
        <h3 className="text-white font-semibold text-sm">Pipeline ứng viên</h3>
        <span className="ml-auto text-slate-400 text-xs">{applications.length} đơn</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const stageApps = applications.filter((a) => a.status === stage.key);
          return (
            <div key={stage.key} className={`rounded-xl border p-3 ${stage.bg} ${stage.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                <span className={`text-lg font-bold ${stage.color}`}>{stageApps.length}</span>
              </div>
              <div className="space-y-2">
                {stageApps.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {app.worker?.firstName?.[0] ?? "?"}
                    </div>
                    <span className="text-slate-300 text-xs truncate flex-1">
                      {app.worker ? `${app.worker.firstName} ${app.worker.lastName}` : "Ứng viên"}
                    </span>
                    {stage.key === ApplicationStatus.PENDING && (
                      <div className="flex gap-1">
                        {onAccept && (
                          <button
                            onClick={() => onAccept(app.id)}
                            className="w-5 h-5 rounded bg-emerald-600/40 hover:bg-emerald-600 text-emerald-300 text-xs transition-colors flex items-center justify-center"
                            title="Chấp nhận"
                          >
                            ✓
                          </button>
                        )}
                        {onReject && (
                          <button
                            onClick={() => onReject(app.id)}
                            className="w-5 h-5 rounded bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs transition-colors flex items-center justify-center"
                            title="Từ chối"
                          >
                            ✗
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {stageApps.length > 3 && (
                  <p className="text-slate-600 text-xs text-center">+{stageApps.length - 3} khác</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
