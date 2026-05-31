"use client";

import { useState } from "react";
import { User } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string, data: { planCode: string; note: string }) => void;
  isLoading: boolean;
  user: User | null;
}

const PLANS = [
  { code: "FREE", label: "Free (Miễn phí)" },
  { code: "PRO", label: "Pro (Cá nhân Cơ bản)" },
  { code: "BUSINESS_LITE", label: "Business Lite (Tổ chức Nhỏ)" },
  { code: "BUSINESS", label: "Business (Tổ chức Không giới hạn)" },
];

export function AssignPlanModal({ isOpen, onClose, onSubmit, isLoading, user }: Props) {
  const [planCode, setPlanCode] = useState("PRO");
  const [note, setNote] = useState("");

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(user.id, { planCode, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/30 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Nâng cấp gói thủ công
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Thực hiện nâng cấp gói cho người dùng <span className="font-semibold text-gray-900">{user.firstName} {user.lastName}</span>. Thường dùng khi khách hàng chuyển khoản thiếu tiền hoặc cần hỗ trợ đặc biệt.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gói dịch vụ</label>
            <select
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required
            >
              {PLANS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách nạp bù tiền thiếu..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận nâng cấp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
