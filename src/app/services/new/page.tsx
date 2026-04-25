"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth-guard";
import {
  categoryService,
  skillService,
  locationService,
  workerServiceAPI,
} from "@/services";
import { JobCategory, Skill, Province, Ward, ServiceType } from "@/types";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";
import { cn } from "@/lib/utils";
import { SearchableCombobox } from "@/components/common/searchable-combobox";

const LocationPicker = dynamic(
  () => import("@/components/job/location-picker"),
  { ssr: false },
);

export default function PostServicePage() {
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
    price: "",
    priceType: "HOURLY" as "HOURLY" | "FIXED",
    isNegotiable: true,
    startTime: "",
    endTime: "",
    recurring: "",
    provinceCode: "",
    wardCode: "",
    radiusKm: "5",
    type: ServiceType.OFFLINE,
    skillIds: [] as string[],
    isAvailableNow: true,
  });

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
    skillService.getAll().then(setSkills).catch(() => {});
    locationService.getProvinces().then(setProvinces).catch(() => {});
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

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    if (form.type !== ServiceType.ONLINE && (!form.provinceCode || !form.wardCode)) {
      setError("Vui lòng chọn Tỉnh/Thành phố và Phường/Xã khu vực làm việc.");
      return;
    }

    setIsSubmitting(true);
    try {
      await workerServiceAPI.createService({
        categoryId: form.categoryId,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        priceType: form.priceType,
        isNegotiable: form.isNegotiable,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        recurring: form.recurring || undefined,
        provinceCode: form.provinceCode,
        wardCode: form.wardCode,
        radiusKm: Number(form.radiusKm),
        type: form.type,
        skillIds: form.skillIds.length > 0 ? form.skillIds : undefined,
        isAvailableNow: form.isAvailableNow,
      });
      router.push(`/services`);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-indigo-100 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <AuthGuard>
      <Navbar />
      <main className="flex-1 min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-white border-b border-indigo-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Đăng Dịch Vụ <span className="text-indigo-600">"Thuê Tôi"</span>
            </h1>
            <p className="mt-2 text-gray-500">
              Công khai thời gian rảnh và kỹ năng của bạn để nhà tuyển dụng dễ dàng tìm thấy.
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
            {/* Header section toggle */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Trạng thái sẵn sàng</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Bật nếu bạn có thể nhận việc đi làm ngay bây giờ.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.isAvailableNow}
                  onChange={(e) => updateForm("isAvailableNow", e.target.checked)}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {form.isAvailableNow ? 'Sẵn sàng ngay' : 'Đang bận'}
                </span>
              </label>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin dịch vụ / Công việc mong muốn</h2>

              <div>
                <label className={labelClass}>
                  Tên dịch vụ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="VD: Chụp ảnh ngoại cảnh, Dọn nhà cuối tuần..."
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
                  placeholder="Giới thiệu về kỹ năng, kinh nghiệm của bạn..."
                  rows={4}
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Danh mục công việc <span className="text-red-400">*</span>
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
            </div>

            {/* Pricing & Time */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Thời gian và Giá cả</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Cách tính giá <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.priceType}
                    onChange={(e) => updateForm("priceType", e.target.value)}
                    className={inputClass}
                  >
                    <option value="HOURLY">Theo giờ</option>
                    <option value="FIXED">Theo công việc (Khoán)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Mức giá mong muốn (Đ) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.price}
                    onChange={(e) => updateForm("price", e.target.value)}
                    placeholder="VD: 50000"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="negotiable"
                  checked={form.isNegotiable}
                  onChange={(e) => updateForm("isNegotiable", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="negotiable" className="text-sm text-gray-700">
                  Cho phép thương lượng giá
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div>
                  <label className={labelClass}>
                    Thời gian bắt đầu rảnh <span className="text-red-400">*</span>
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
                    Đến lúc <span className="text-red-400">*</span>
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
              
              <div>
                <label className={labelClass}>
                  Chu kỳ lặp lại (Tuỳ chọn)
                </label>
                <select
                  value={form.recurring}
                  onChange={(e) => updateForm("recurring", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Không lặp lại (Chỉ thời gian trên)</option>
                  <option value="DAILY">Hàng ngày (các buổi tối...)</option>
                  <option value="WEEKENDS">Mỗi cuối tuần</option>
                  <option value="WEEKDAYS">Các ngày trong tuần</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Khu vực làm việc</h2>

              <div>
                <label className={labelClass}>Hình thức cung cấp dịch vụ</label>
                <div className="flex gap-4">
                  {(["OFFLINE", "ONLINE", "BOTH"] as ServiceType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={form.type === type}
                        onChange={() => updateForm("type", type)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">
                        {type === "OFFLINE" ? "Trực tiếp" : type === "ONLINE" ? "Online" : "Cả hai"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {form.type !== ServiceType.ONLINE && (
                <>
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
                        Phường/Xã muốn nhận việc <span className="text-red-400">*</span>
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
                    <label className={labelClass}>Bán kính di chuyển (Km)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.radiusKm}
                      onChange={(e) => updateForm("radiusKm", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-white rounded-2xl border border-indigo-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Kỹ năng thế mạnh
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
                          ? "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-200"
                          : "bg-white text-gray-600 border-indigo-100 hover:border-indigo-300 hover:text-indigo-600",
                      )}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Đang xuất bản..." : "Xuất bản Dịch vụ"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </AuthGuard>
  );
}
