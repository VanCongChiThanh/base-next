"use client";

import { useState } from "react";
import { WorkerService } from "@/types";
import { workerServiceAPI } from "@/services";
import { toast } from "react-hot-toast";

interface DirectHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: WorkerService | null;
}

type HireMode = "GIG" | "PART_TIME" | "FIXED_PACKAGE";

export function DirectHireModal({ isOpen, onClose, service }: DirectHireModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mode: "GIG" as HireMode,
    price: "",
    startTime: "",
    endTime: "",
  });

  if (!isOpen || !service) return null;

  const isFixedPackage = formData.mode === "FIXED_PACKAGE";
  const resolvedPrice = Number(formData.price) || Number(service.price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dto: any = {
        title: formData.title,
        description: formData.description,
      };

      // "Khoán" is a direct-hire contract, not a public job post.
      // We store it as an ONLINE/FIXED_PRICE job so payment/progress can reuse the existing fixed-price flow.
      if (isFixedPackage) {
        dto.jobType = "ONLINE";
        dto.onlinePaymentType = "FIXED_PRICE";
        dto.totalBudget = resolvedPrice;
        dto.deadline = formData.endTime || undefined;
      } else {
        dto.jobType = formData.mode;
        dto.salaryPerHour = resolvedPrice;
        dto.startTime = formData.startTime || undefined;
        dto.endTime = formData.endTime || undefined;
      }

      await workerServiceAPI.hireDirectly(service.id, dto);
      toast.success("Yêu cầu thuê đã được gửi thành công!");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed z-[1000] bg-white flex flex-col bottom-0 left-1/2 -translate-x-1/2 w-full sm:w-[540px] max-h-[92dvh] sm:max-h-[720px] rounded-t-3xl sm:rounded-b-3xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center pt-3 pb-2 sm:hidden shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:p-6 bg-indigo-50 border-b border-indigo-100 shrink-0 sm:rounded-t-3xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Thuê ngay</p>
            <h2 className="text-lg sm:text-xl font-extrabold text-indigo-900 m-0">
              Gửi đề nghị trực tiếp
            </h2>
            <p className="text-xs sm:text-sm text-indigo-600 mt-1 mb-0">
              Đến <span className="font-bold">{service.worker?.firstName} {service.worker?.lastName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-indigo-200/50 hover:bg-indigo-200 flex items-center justify-center text-indigo-700 transition-colors shrink-0"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:p-6">
          <form id="hireForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-800">
              Đây là yêu cầu thuê riêng cho một người cụ thể, không hiển thị như bài đăng tuyển công khai.
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Tiêu đề công việc *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Chụp ảnh sự kiện, thiết kế landing page..."
                className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả yêu cầu *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả kết quả mong muốn, thời gian, địa điểm hoặc file bàn giao..."
                className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Hình thức thuê *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "GIG", label: "Theo giờ/ca" },
                  { value: "PART_TIME", label: "Dài hạn" },
                  { value: "FIXED_PACKAGE", label: "Khoán" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: option.value as HireMode })}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                      formData.mode === option.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  {isFixedPackage ? "Ngân sách đề xuất (VNĐ)" : "Giá đề xuất / giờ (VNĐ)"}
                  <span className="text-xs font-normal text-gray-500 ml-2">(Có thể thoả thuận)</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder={`${Number(service.price).toLocaleString("vi-VN")}đ`}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  {isFixedPackage ? "Deadline (không bắt buộc)" : "Kết thúc (không bắt buộc)"}
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {!isFixedPackage && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Bắt đầu (không bắt buộc)</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            )}
          </form>
        </div>

        <div className="flex gap-3 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4 sm:px-6 bg-gray-50 border-t border-gray-100 shrink-0 sm:rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-6 py-3.5 text-sm font-bold rounded-xl border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            form="hireForm"
            type="submit"
            disabled={loading}
            className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70"
          >
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </>
  );
}
