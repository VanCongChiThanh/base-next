"use client";

import { useState } from "react";
import type { ScamAnalysisResult } from "@/services/ai.service";
import { analyzeJob } from "@/services/ai.service";

const riskConfig: Record<string, { bg: string; bar: string; icon: string; label: string }> = {
  safe: { bg: "bg-emerald-50", bar: "bg-emerald-500", icon: "🛡️", label: "An toàn" },
  low: { bg: "bg-blue-50", bar: "bg-blue-500", icon: "ℹ️", label: "Rủi ro thấp" },
  medium: { bg: "bg-amber-50", bar: "bg-amber-500", icon: "⚠️", label: "Cần cảnh giác" },
  high: { bg: "bg-orange-50", bar: "bg-orange-500", icon: "🚨", label: "Nghi ngờ cao" },
  critical: { bg: "bg-red-50", bar: "bg-red-500", icon: "🛑", label: "Rất nguy hiểm" },
};

interface ScamAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

export function ScamAnalysisModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
}: ScamAnalysisModalProps) {
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await analyzeJob(jobId);
      setResult(res);
    } catch {
      setError("Không thể phân tích. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const config = result
    ? riskConfig[result.riskLevel] || riskConfig.medium
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-lg">🛡️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                AI Kiểm tra tin tuyển dụng
              </h3>
              <p className="text-xs text-gray-400 truncate max-w-[250px]">
                {jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Not analyzed yet */}
          {!result && !loading && !error && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                AI sẽ phân tích tin tuyển dụng này dựa trên nhiều tiêu chí để
                đánh giá mức độ an toàn.
              </p>
              <button
                onClick={handleAnalyze}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all hover:-translate-y-0.5"
              >
                🛡️ Bắt đầu kiểm tra
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Đang phân tích bằng AI...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Kiểm tra quy tắc, mẫu lừa đảo, và phân tích nội dung
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={handleAnalyze}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Results */}
          {result && config && (
            <>
              {/* Score Card */}
              <div className={`rounded-xl p-4 ${config.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span className="font-semibold text-gray-900">
                      {config.label}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {result.scamScore}
                    <span className="text-base font-normal text-gray-500">
                      /100
                    </span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${config.bar}`}
                    style={{ width: `${result.scamScore}%` }}
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  💡 Lời khuyên
                </p>
                <p className="text-sm text-blue-700">
                  {result.recommendation}
                </p>
              </div>

              {/* Reasons */}
              {result.reasons.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    📋 Chi tiết phân tích ({result.reasons.length} phát hiện)
                  </h4>
                  <ul className="space-y-2">
                    {result.reasons.map((reason, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">
                          ⚡
                        </span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Matched patterns */}
              {result.matchedPatterns.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    🔗 Mẫu lừa đảo tương tự
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedPatterns.map((p, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-100"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze again */}
              <button
                onClick={handleAnalyze}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                ↻ Phân tích lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
