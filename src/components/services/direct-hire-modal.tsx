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
    jobType: "GIG", // Default to GIG for simple hire
    price: "",
    startTime: "",
    endTime: "",
  });

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map formData to DirectHireDto
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-indigo-900">Thuê Trực Tiếp</h2>
            <p className="text-sm text-indigo-600 mt-1">
              Gửi yêu cầu thuê đến <span className="font-bold">{service.worker?.firstName} {service.worker?.lastName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 hover:bg-indigo-200 hover:text-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
          <form id="hireForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề công việc *</label>
              <input 
                required
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="VD: Sửa ống nước tại nhà, Chụp ảnh sự kiện..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả công việc *</label>
              <textarea 
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả chi tiết những việc cần làm..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Hình thức *</label>
                <select 
                  value={formData.jobType}
                  onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="GIG">Việc làm theo giờ/ca (GIG)</option>
                  <option value="PART_TIME">Hợp đồng dài hạn (Part-time)</option>
                  <option value="ONLINE">Làm việc trực tuyến (Online)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Đề xuất giá (VNĐ)</label>
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder={`Mặc định: ${service.price}`}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bắt đầu</label>
                <input 
                  type="datetime-local" 
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kết thúc / Deadline</label>
                <input 
                  type="datetime-local" 
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            form="hireForm"
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}
