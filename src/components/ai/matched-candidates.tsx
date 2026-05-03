"use client";

import { useState } from "react";
import Link from "next/link";
import { matchCandidates } from "@/services/ai.service";
import { MatchedCandidate, Job } from "@/types";
import { getErrorMessage } from "@/lib/api-client";

interface MatchedCandidatesProps {
  job: Job;
}

export function MatchedCandidates({ job }: MatchedCandidatesProps) {
  const [candidates, setCandidates] = useState<MatchedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleMatch = async () => {
    try {
      setLoading(true);
      setError("");
      const results = await matchCandidates(job.id, 5); // get top 5
      setCandidates(results);
      setHasSearched(true);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Tìm kiếm ứng viên
          </h2>
          <p className="text-sm text-gray-500">Tìm kiếm các ứng viên phù hợp nhất bằng công nghệ AI.</p>
        </div>
        <button
          onClick={handleMatch}
          disabled={loading}
          className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 disabled:opacity-50 transition-colors flex items-center gap-2 border border-purple-200"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang phân tích...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Tìm ứng viên ({candidates.length > 0 ? 'Tìm lại' : '1 Click'})
            </>
          )}
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm mb-4">{error}</div>}

      {hasSearched && !loading && candidates.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          Không tìm thấy ứng viên nào phù hợp với yêu cầu.
        </div>
      )}

      {candidates.length > 0 && (
        <div className="space-y-4 mt-4">
          {candidates.map((c, i) => (
            <div key={c.workerId} className="p-4 rounded-xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/30 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center text-white font-bold">
                    {c.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.fullName}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center">⭐ {c.ratingAvg.toFixed(1)}</span>
                      <span>•</span>
                      <span>Đã làm {c.totalJobsCompleted} job</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                    Phù hợp {c.matchScore}%
                  </span>
                  <Link
                    href={`/workers/${c.workerId}`}
                    target="_blank"
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Xem hồ sơ →
                  </Link>
                </div>
              </div>
              
              <div className="bg-white/60 p-3 rounded-lg border border-purple-50">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Lý do phù hợp:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {c.matchReasons.map((r, idx) => (
                    <li key={idx} className="flex gap-1.5 items-start">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {c.skills && c.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.skills.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                      {skill}
                    </span>
                  ))}
                  {c.skills.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                      +{c.skills.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
