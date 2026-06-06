"use client";

import { useState, useEffect } from "react";
import type { ScamAnalysisResult } from "@/services/ai.service";
import { analyzeJob } from "@/services/ai.service";

const riskConfig: Record<string, { bg: string; bar: string; icon: string; label: string }> = {
  safe: { bg: "bg-emerald-50", bar: "bg-emerald-500", icon: "🛡️", label: "An toàn" },
  low: { bg: "bg-blue-50", bar: "bg-blue-500", icon: "ℹ️", label: "Rủi ro thấp" },
  medium: { bg: "bg-amber-50", bar: "bg-amber-500", icon: "⚠️", label: "Cần cảnh giác" },
  high: { bg: "bg-orange-50", bar: "bg-orange-500", icon: "🚨", label: "Nghi ngờ cao" },
  critical: { bg: "bg-red-50", bar: "bg-red-500", icon: "🛑", label: "Rất nguy hiểm" },
};

interface ScamAnalysisAlertProps {
  jobId: string;
}

export function ScamAnalysisAlert({ jobId }: ScamAnalysisAlertProps) {
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalysis = async () => {
      try {
        const res = await analyzeJob(jobId);
        if (isMounted) {
          setResult(res);
        }
      } catch (err) {
        // silently fail or ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchAnalysis();
    return () => { isMounted = false; };
  }, [jobId]);

  if (loading) {
    return (
      <div className="animate-pulse flex items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100 mb-2">
        <span className="text-sm text-gray-500">Đang tải phân tích AI...</span>
      </div>
    );
  }

  // Nếu không có kết quả cache (null) thì không hiển thị gì cả theo yêu cầu
  if (!result) return null;

  const config = riskConfig[result.riskLevel] || riskConfig.medium;
  const showExpandButton = result.reasons.length > 2;
  const displayedReasons = isExpanded ? result.reasons : result.reasons.slice(0, 2);

  return (
    <div className={`rounded-xl p-4 mb-2 border border-white/20 shadow-sm ${config.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span className="font-semibold text-gray-900 text-sm">
            AI Đánh giá: {config.label}
          </span>
        </div>
        <span className="text-lg font-bold text-gray-900">
          {result.scamScore}
          <span className="text-xs font-normal text-gray-500">/100</span>
        </span>
      </div>
      
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${config.bar}`}
          style={{ width: `${result.scamScore}%` }}
        />
      </div>

      {result.riskLevel !== "safe" && (
        <div className="mt-2">
          <ul className="space-y-1">
            {displayedReasons.map((reason, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                <span className="text-amber-500 mt-0.5">•</span>
                <span className={isExpanded ? "" : "line-clamp-1"} title={reason}>{reason}</span>
              </li>
            ))}
          </ul>
          {showExpandButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 mt-1.5 flex items-center gap-1 transition-colors focus:outline-none"
            >
              {isExpanded ? "Thu gọn" : `+ ${result.reasons.length - 2} lưu ý khác`}
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
