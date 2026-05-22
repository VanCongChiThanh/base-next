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

export function DirectHireModal({ isOpen, onClose, service }: DirectHireModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobType: "GIG",
    price: "",
    startTime: "",
    endTime: "",
  });

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dto: any = {
        title: formData.title,
        description: formData.description,
        jobType: formData.jobType,
      };
      if (formData.jobType === "ONLINE") {
        dto.totalBudget = Number(formData.price) || service.price;
        dto.deadline = formData.endTime || undefined;
      } else {
        dto.salaryPerHour = Number(formData.price) || service.price;
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
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div 
        className="fixed z-[1000] bg-white flex flex-col bottom-0 left-1/2 -translate-x-1/2 w-full sm:w-[520px] max-h-[92dvh] sm:max-h-[680px] rounded-t-3xl sm:rounded-b-3xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:p-6 bg-indigo-50 border-b border-indigo-100 shrink-0 sm:rounded-t-3xl">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-indigo-900 m-0">Thuê Trực Tiếp</h2>
            <p className="text-xs sm:text-sm text-indigo-600 mt-1 mb-0">
              Gửi yêu cầu đến <span className="font-bold">{service.worker?.firstName} {service.worker?.lastName}</span>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:p-6 space-y-4">
          <form id="hireForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Tiêu đề công việc *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Sửa ống nước, Chụp ảnh sự kiện..."
                className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả công việc *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết những việc cần làm..."
                className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình thức *</label>
                <select
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                >
                  <option value="GIG">Theo giờ / ca (GIG)</option>
                  <option value="PART_TIME">Dài hạn (Part-time)</option>
                  <option value="ONLINE">Trực tuyến (Online)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  {formData.jobType === "ONLINE" ? "Ngân sách (VNĐ)" : "Giá / giờ (VNĐ)"}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  {formData.jobType === "ONLINE" ? "Ngày bắt đầu" : "Bắt đầu"}
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  {formData.jobType === "ONLINE" ? "Deadline" : "Kết thúc"}
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
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
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                </svg>
                Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
