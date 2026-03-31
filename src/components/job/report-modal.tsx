"use client";

import { useState } from "react";
import { reportService, CreateReportRequest } from "@/services";

interface Props {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Nội dung công việc không đúng thực tế",
  "Mức lương/thời gian không hợp lý",
  "Có dấu hiệu lừa đảo",
  "Ngôn từ không phù hợp/phản cảm",
  "Yêu cầu cá nhân/nhạy cảm",
  "Khác"
];

export function ReportModal({ jobId, isOpen, onClose }: Props) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload: CreateReportRequest = {
        targetId: jobId,
        targetType: "JOB",
        reason,
        description: description.trim() || undefined,
      };

      await reportService.createReport(payload);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // reset state after closing
        setTimeout(() => {
          setSuccess(false);
          setReason(REPORT_REASONS[0]);
          setDescription("");
        }, 500);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Có lỗi xảy ra khi gửi báo cáo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={isSubmitting ? undefined : onClose}
      />
      <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-lg">Báo cáo công việc</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900">Đã gửi báo cáo!</h4>
              <p className="text-gray-500 text-sm">Cảm ơn bạn. Quản trị viên sẽ xem xét báo cáo này sớm nhất có thể.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-gray-500 leading-relaxed">
                Vui lòng cho chúng tôi biết vấn đề với tin tuyển dụng này. Hệ thống sẽ giữ ẩn danh thông tin của bạn.
              </p>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do báo cáo *</label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-800 font-medium">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thông tin thêm (không bắt buộc)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cung cấp thêm chi tiết để giúp chúng tôi xử lý nhanh hơn..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-400 resize-none h-24"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-md hover:shadow-red-200 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : "Gửi Báo Cáo"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
