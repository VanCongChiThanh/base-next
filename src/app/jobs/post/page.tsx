"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth-guard";
import {
  jobService,
  categoryService,
  skillService,
  locationService,
} from "@/services";
import { JobCategory, Skill, Province, Ward, JobSalaryType } from "@/types";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";
import { cn } from "@/lib/utils";
import { SearchableCombobox } from "@/components/common/searchable-combobox";

const LocationPicker = dynamic(
  () => import("@/components/job/location-picker"),
  { ssr: false },
);

export default function PostJobPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    salaryPerHour: "",
    salaryType: "HOURLY" as JobSalaryType,
    requiredWorkers: "1",
    startTime: "",
    endTime: "",
    provinceCode: "",
    wardCode: "",
    address: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    skillIds: [] as string[],
  });

  useEffect(() => {
    categoryService
      .getAll()
      .then(setCategories)
      .catch(() => {});
    skillService
      .getAll()
      .then(setSkills)
      .catch(() => {});
    locationService
      .getProvinces()
      .then(setProvinces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.provinceCode) {
      locationService
        .getProvinceWithWards(form.provinceCode)
        .then((data) => setWards(data.wards))
        .catch(() => setWards([]));
    } else {
      setWards([]);
    }
  }, [form.provinceCode]);

  const updateForm = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleLocationChange = useCallback((lat: number, lng: number) => {
    // Dùng thẳng setForm để gộp 2 biến vào 1 lần cập nhật duy nhất
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);
  const toggleSkill = (skillId: string) => {
    setForm((prev) => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId],
    }));
  };

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: `${c.icon ?? ""} ${c.name}`.trim(),
      })),
    [categories],
  );

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p.code, label: p.fullName })),
    [provinces],
  );

  const wardOptions = useMemo(
    () => wards.map((w) => ({ value: w.code, label: w.fullName })),
    [wards],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.categoryId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }
    if (!form.provinceCode || !form.wardCode) {
      setError("Vui lòng chọn tỉnh/thành và phường/xã.");
      return;
    }
    setIsSubmitting(true);
    try {
      const job = await jobService.createJob({
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        salaryPerHour: Number(form.salaryPerHour),
        salaryType: form.salaryType,
        requiredWorkers: Number(form.requiredWorkers),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        provinceCode: form.provinceCode,
        wardCode: form.wardCode,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        skillIds: form.skillIds.length > 0 ? form.skillIds : undefined,
      });
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-blue-100 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <AuthGuard>
      <Navbar />
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-white border-b border-blue-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Đăng <span className="text-blue-600">việc mới</span>
            </h1>
            <p className="mt-2 text-gray-500">
              Điền thông tin chi tiết để tìm được ứng viên phù hợp
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                Thông tin cơ bản
              </h2>

              <div>
                <label className={labelClass}>
                  Tiêu đề công việc <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="VD: Phục vụ nhà hàng cuối tuần"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Mô tả chi tiết <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Mô tả chi tiết công việc, yêu cầu và quyền lợi..."
                  rows={5}
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Danh mục <span className="text-red-400">*</span>
                  </label>
                  <SearchableCombobox
                    options={categoryOptions}
                    value={form.categoryId}
                    onChange={(v) => updateForm("categoryId", v)}
                    placeholder="Chọn danh mục"
                    searchPlaceholder="Tìm danh mục..."
                    buttonClassName={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Số người cần tuyển <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.requiredWorkers}
                    onChange={(e) =>
                      updateForm("requiredWorkers", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Salary & Time */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                Lương & thời gian
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Cách trả lương <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.salaryType}
                    onChange={(e) => updateForm("salaryType", e.target.value)}
                    className={inputClass}
                  >
                    <option value="HOURLY">Theo giờ</option>
                    <option value="FIXED">Khoán (cố định / công)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Lương (đ/{form.salaryType === "FIXED" ? "công" : "giờ"}){" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.salaryPerHour}
                    onChange={(e) =>
                      updateForm("salaryPerHour", e.target.value)
                    }
                    placeholder="VD: 50000"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Bắt đầu <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startTime}
                    onChange={(e) => updateForm("startTime", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Kết thúc <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endTime}
                    onChange={(e) => updateForm("endTime", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                Địa điểm
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Tỉnh/Thành phố <span className="text-red-400">*</span>
                  </label>
                  <SearchableCombobox
                    options={provinceOptions}
                    value={form.provinceCode}
                    onChange={(v) => {
                      updateForm("provinceCode", v);
                      updateForm("wardCode", "");
                    }}
                    placeholder="Chọn tỉnh/thành"
                    searchPlaceholder="Tìm tỉnh/thành..."
                    buttonClassName={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Phường/Xã <span className="text-red-400">*</span>
                  </label>
                  <SearchableCombobox
                    options={wardOptions}
                    value={form.wardCode}
                    onChange={(v) => updateForm("wardCode", v)}
                    placeholder="Chọn phường/xã"
                    searchPlaceholder="Tìm phường/xã..."
                    disabled={!form.provinceCode}
                    buttonClassName={cn(
                      inputClass,
                      !form.provinceCode && "opacity-50 cursor-not-allowed",
                    )}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Địa chỉ chi tiết <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="VD: 123 Nguyễn Văn A, Quận 1"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Vị trí trên bản đồ{" "}
                  <span className="text-gray-400 font-normal text-xs ml-1">
                    (Bấm để ghim)
                  </span>
                </label>
                <div className="mt-1">
                  <LocationPicker
                    initialLat={form.latitude}
                    initialLng={form.longitude}
                    onChange={handleLocationChange}
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-white rounded-2xl border border-blue-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">4</span>
                  </div>
                  Kỹ năng yêu cầu
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    (không bắt buộc)
                  </span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                        form.skillIds.includes(skill.id)
                          ? "bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-200"
                          : "bg-white text-gray-600 border-blue-100 hover:border-blue-300 hover:text-blue-600",
                      )}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Huỷ bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Đang đăng..." : "Đăng tuyển"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </AuthGuard>
  );
}
