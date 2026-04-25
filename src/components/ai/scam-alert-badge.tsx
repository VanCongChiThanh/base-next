"use client";

import type { ScamAnalysisResult } from "@/services/ai.service";

const riskConfig = {
  safe: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅", label: "An toàn" },
  low: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: "ℹ️", label: "Thấp" },
  medium: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: "⚠️", label: "Cảnh giác" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: "🚨", label: "Nghi ngờ" },
  critical: { color: "bg-red-100 text-red-700 border-red-200", icon: "🛑", label: "Nguy hiểm" },
};

interface ScamAlertBadgeProps {
  result: ScamAnalysisResult | null;
  loading?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function ScamAlertBadge({
  result,
  loading,
  compact,
  onClick,
}: ScamAlertBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-xs animate-pulse">
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Đang kiểm tra...
      </span>
    );
  }

  if (!result) return null;

  const config = riskConfig[result.riskLevel] || riskConfig.medium;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium hover:opacity-80 transition cursor-pointer ${config.color}`}
        title={`Mức độ rủi ro: ${config.label} (${result.scamScore}%)`}
      >
        <span>{config.icon}</span>
        <span>{result.scamScore}%</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium hover:opacity-80 transition cursor-pointer ${config.color}`}
      title={result.recommendation}
    >
      <span>{config.icon}</span>
      <span>
        {config.label} · {result.scamScore}%
      </span>
    </button>
  );
}
