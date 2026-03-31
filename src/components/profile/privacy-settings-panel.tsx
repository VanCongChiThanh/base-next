"use client";

import { useState } from "react";
import { WorkerPrivacySettings, EmployerPrivacySettings, PrivacyVisibility } from "@/types";

type PrivacyRole = "worker" | "employer";

interface PrivacyFieldConfig {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const WORKER_FIELDS: PrivacyFieldConfig[] = [
  { key: "phone", label: "Số điện thoại", description: "Ai có thể xem số điện thoại của bạn?", icon: "📱" },
  { key: "address", label: "Địa chỉ", description: "Ai có thể xem địa chỉ của bạn?", icon: "🏠" },
  { key: "dateOfBirth", label: "Ngày sinh", description: "Ai có thể xem ngày sinh của bạn?", icon: "🎂" },
  {
    key: "location",
    label: "Khu vực trên hồ sơ",
    description:
      "Mức hiển thị tỉnh/thành hoặc khu vực bạn khai trong hồ sơ khi nhà tuyển dụng xem (tùy màn hình ứng dụng).",
    icon: "📍",
  },
];

const EMPLOYER_FIELDS: PrivacyFieldConfig[] = [
  { key: "phone", label: "Số điện thoại", description: "Ai có thể xem số điện thoại công ty?", icon: "📱" },
  { key: "address", label: "Địa chỉ công ty", description: "Ai có thể xem địa chỉ công ty?", icon: "🏢" },
  {
    key: "companyDescription",
    label: "Mô tả công ty",
    description:
      "Ai có thể xem phần mô tả công ty (áp dụng khi hệ thống hiển thị trên hồ sơ / tin tuyển).",
    icon: "📄",
  },
];

const VISIBILITY_OPTIONS: { value: PrivacyVisibility; label: string; color: string; bg: string; desc: string }[] = [
  {
    value: "PUBLIC",
    label: "Công khai",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    desc: "Tất cả mọi người",
  },
  {
    value: "ACCEPTED_ONLY",
    label: "Khi chấp nhận",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    desc: "Sau khi được nhận vào ca / đang làm",
  },
  {
    value: "PRIVATE",
    label: "Riêng tư",
    color: "text-gray-500",
    bg: "bg-gray-100 border-gray-200",
    desc: "Không ai được xem",
  },
];

interface Props {
  role: PrivacyRole;
  initialSettings?: Partial<WorkerPrivacySettings | EmployerPrivacySettings>;
  onSave: (settings: Partial<WorkerPrivacySettings | EmployerPrivacySettings>) => Promise<void>;
}

function PrivacyFieldRow({
  field,
  value,
  onChange,
}: {
  field: PrivacyFieldConfig;
  value: PrivacyVisibility;
  onChange: (v: PrivacyVisibility) => void;
}) {
  const currentOption = VISIBILITY_OPTIONS.find((o) => o.value === value) ?? VISIBILITY_OPTIONS[1];

  return (
    <div className="group p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{field.icon}</span>
          <div>
            <p className="text-gray-900 font-medium text-sm">{field.label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{field.description}</p>
          </div>
        </div>
        {/* Current badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full border ${currentOption.bg} ${currentOption.color} font-medium hidden sm:inline`}>
          {currentOption.label}
        </span>
      </div>

      <div className="flex gap-2 mt-3">
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all duration-150 ${
              value === opt.value
                ? `${opt.bg} ${opt.color} border-current scale-[1.02] shadow-sm`
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PrivacySettingsPanel({ role, initialSettings = {}, onSave }: Props) {
  const fields = role === "worker" ? WORKER_FIELDS : EMPLOYER_FIELDS;
  
  const getDefaults = (): Record<string, PrivacyVisibility> => {
    if (role === "worker") {
      return { phone: "ACCEPTED_ONLY", address: "ACCEPTED_ONLY", dateOfBirth: "PRIVATE", location: "PUBLIC" };
    }
    return { phone: "ACCEPTED_ONLY", address: "PUBLIC", companyDescription: "PUBLIC" };
  };

  const defaults = getDefaults();

  const [settings, setSettings] = useState<Record<string, PrivacyVisibility>>(() => {
    const init: Record<string, PrivacyVisibility> = {};
    fields.forEach((f) => {
      init[f.key] = (initialSettings as Record<string, PrivacyVisibility>)[f.key] ?? defaults[f.key];
    });
    return init;
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: PrivacyVisibility) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      await onSave(settings as Partial<WorkerPrivacySettings | EmployerPrivacySettings>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🔐</span>
        <h3 className="text-gray-900 font-bold text-base">Cài đặt quyền riêng tư</h3>
      </div>
      <p className="text-gray-500 text-xs mb-5">
        Kiểm soát thông tin nào được hiển thị với{" "}
        {role === "worker" ? "nhà tuyển dụng" : "người lao động"}.
      </p>

      <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2 shadow-sm">
        <span className="shrink-0 text-amber-500">ℹ️</span>
        <span>
          <strong>Tên và ảnh đại diện</strong> thường hiển thị trên hồ sơ. Với <strong>số điện thoại</strong>:
          khi đơn ứng tuyển <strong>chưa được chấp nhận</strong>, chỉ lộ nếu bạn chọn <strong>Công khai</strong>;
          sau khi <strong>được nhận vào ca</strong> (hoặc đang làm), SĐT được dùng để liên lạc theo luồng ứng tuyển.
        </span>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <PrivacyFieldRow
            key={field.key}
            field={field}
            value={settings[field.key]}
            onChange={(v) => handleChange(field.key, v)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full mt-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
          saved
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-blue-200"
        } disabled:opacity-60`}
      >
        {isSaving ? "Đang lưu..." : saved ? "✓ Đã lưu" : "Lưu cài đặt quyền riêng tư"}
      </button>
    </div>
  );
}
