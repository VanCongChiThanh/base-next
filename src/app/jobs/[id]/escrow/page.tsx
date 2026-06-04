"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EscrowSection } from "@/components/job/escrow-section";
import { jobService } from "@/services";
import { Job } from "@/types";

export default function JobEscrowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    jobService
      .getJob(id)
      .then((data) => {
        setJob(data);
      })
      .catch(() => {
        setError("Không thể tải thông tin công việc.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại công việc
        </Link>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-100 rounded w-1/4"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        ) : error || !job ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold">{error || "Không tìm thấy công việc"}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h1>
              <p className="text-sm text-gray-500">Chi tiết ký quỹ và tiến trình Milestone</p>
            </div>
            <EscrowSection job={job} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
