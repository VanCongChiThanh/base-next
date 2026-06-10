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
import { JobCategory, Skill, Province, Ward, JobSalaryType, JobType, OnlinePaymentType, ExperienceLevel, PaymentMethod } from "@/types";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";
import { cn } from "@/lib/utils";
import { SearchableCombobox } from "@/components/common/searchable-combobox";
import { UpgradePrompt } from "@/components/common/upgrade-prompt";
import { useEntitlements } from "@/contexts/entitlement-context";
import { useAuth } from "@/contexts";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const ONLINE_SKILL_NAMES = ["Thiết kế", "Marketing", "Gia sư", "Chụp ảnh", "MC"];
const GIG_SKILL_NAMES = ["Phục vụ", "Pha chế", "Nấu ăn", "Bán hàng", "Khuân vác", "Lái xe", "Dọn dẹp", "Chụp ảnh", "MC"];

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
  const [hireId, setHireId] = useState<string | null>(null);
  const { entitlements, isLoading: isEntitlementsLoading, refreshEntitlements } = useEntitlements();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setHireId(urlParams.get("hire_id"));
    }
  }, []);

  const [form, setForm] = useState({
    jobType: "GIG" as JobType,
    paymentMethod: PaymentMethod.P2P,
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
    // Part-time fields
    contractDuration: "",
    workSchedule: "",
    paymentNote: "",
    // Online fields
    onlinePaymentType: OnlinePaymentType.FIXED_PRICE,
    totalBudget: "",
    hourlyRateMin: "",
    hourlyRateMax: "",
    deadline: "",
    experienceLevel: "" as ExperienceLevel | "",
    deliverableType: "",
    projectScope: "",
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
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "jobType") {
        next.skillIds = [];
        next.categoryId = "";
      }
      return next;
    });
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
      categories
        .filter((c) => !c.type || c.type === (form.jobType === JobType.ONLINE ? "ONLINE" : "GIG"))
        .map((c) => ({
          value: c.id,
          label: `${c.icon ?? ""} ${c.name}`.trim(),
        })),
    [categories, form.jobType],
  );

  const filteredSkills = useMemo(() => {
    if (form.jobType === JobType.ONLINE) {
      return skills.filter((s) => ONLINE_SKILL_NAMES.includes(s.name));
    } else {
      return skills.filter((s) => GIG_SKILL_NAMES.includes(s.name));
    }
  }, [skills, form.jobType]);

  const titlePlaceholder = useMemo(() => {
    return form.jobType === JobType.ONLINE
      ? "VD: Thiết kế Landing Page, Lập trình ReactJS, Dịch thuật Anh-Việt..."
      : "VD: Phục vụ nhà hàng cuối tuần, Bốc xếp hàng hoá, Giao hàng nội thành...";
  }, [form.jobType]);

  const descPlaceholder = useMemo(() => {
    return form.jobType === JobType.ONLINE
      ? "Mô tả chi tiết dự án, các yêu cầu kỹ thuật, sản phẩm cần bàn giao, thời hạn và tiêu chí đánh giá..."
      : "Mô tả chi tiết công việc, thời gian làm việc, địa chỉ cụ thể, yêu cầu về sức khoẻ và trang phục...";
  }, [form.jobType]);

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p.code, label: p.fullName })),
    [provinces],
  );

  const wardOptions = useMemo(
    () => wards.map((w) => ({ value: w.code, label: w.fullName })),
    [wards],
  );

  const monthlyPostLimit = entitlements?.features?.["job.post.monthly_limit"];
  const monthlyPostUsed = entitlements?.features?.["job.post.monthly_used"];
  const monthlyPostRemaining =
    entitlements?.features?.["job.post.monthly_remaining"];
  const hasUnlimitedMonthlyPosts = Boolean(
    entitlements?.features?.["job.post.unlimited"],
  );
  const isOutOfMonthlyPosts =
    !hasUnlimitedMonthlyPosts &&
    typeof monthlyPostRemaining === "number" &&
    monthlyPostRemaining <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.categoryId) {
      const msg = "Vui lòng chọn danh mục.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.jobType !== JobType.ONLINE) {
      if (!form.provinceCode || !form.wardCode) {
        const msg = "Vui lòng chọn tỉnh/thành và phường/xã.";
        setError(msg);
        toast.error(msg);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        skillIds: form.skillIds.length > 0 ? form.skillIds : undefined,
        jobType: form.jobType,
        paymentMethod: form.paymentMethod,
      };

      if (form.jobType === JobType.ONLINE) {
        payload.onlinePaymentType = form.onlinePaymentType;
        if (form.onlinePaymentType === OnlinePaymentType.FIXED_PRICE) {
          payload.totalBudget = Number(form.totalBudget);
        } else {
          payload.hourlyRateMin = Number(form.hourlyRateMin);
          if (form.hourlyRateMax) payload.hourlyRateMax = Number(form.hourlyRateMax);
        }
        if (form.deadline) payload.deadline = new Date(form.deadline).toISOString();
        if (form.experienceLevel) payload.experienceLevel = form.experienceLevel;
        if (form.deliverableType) payload.deliverableType = form.deliverableType;
        if (form.projectScope) payload.projectScope = form.projectScope;
      } else {
        payload.salaryPerHour = Number(form.salaryPerHour);
        payload.salaryType = form.salaryType;
        payload.requiredWorkers = Number(form.requiredWorkers);
        payload.startTime = new Date(form.startTime).toISOString();
        if (form.endTime) payload.endTime = new Date(form.endTime).toISOString();
        payload.provinceCode = form.provinceCode;
        payload.wardCode = form.wardCode;
        payload.address = form.address;
        payload.latitude = form.latitude;
        payload.longitude = form.longitude;

        // Part-time fields
        if (form.jobType === JobType.PART_TIME) {
          payload.contractDuration = form.contractDuration || undefined;
          payload.workSchedule = form.workSchedule || undefined;
          payload.paymentNote = form.paymentNote || undefined;
        }
      }

      const job = await jobService.createJob(payload);
      await refreshEntitlements();
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      const msg = getErrorMessage(err as ApiError);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-blue-100 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  const isEkycVerified = 
    user?.role === "RECRUITER" || 
    user?.verificationLevel === "BASIC" || 
    user?.verificationLevel === "BUSINESS";

  if (!isAuthLoading && user && !isEkycVerified) {
    return (
      <AuthGuard>
        <Navbar />
        <main className="flex-1 min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-200 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa xác thực eKYC</h2>
            <p className="text-gray-600 mb-6">
              Bạn cần phải hoàn tất xác minh danh tính (eKYC) trước khi có thể đăng tin tuyển dụng. Điều này giúp đảm bảo an toàn cho cộng đồng của chúng tôi.
            </p>
            <Link href="/profile" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
              Đi đến Xác thực ngay
            </Link>
          </div>
        </main>
        <Footer />
      </AuthGuard>
    );
  }

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
              {hireId 
                ? "Tạo công việc mới dành riêng cho ứng viên bạn muốn thuê."
                : "Điền thông tin chi tiết để tìm được ứng viên phù hợp"}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {hireId && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-4">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 text-base">Tính năng Thuê Cá Nhân</h3>
                <p className="text-sm text-indigo-700/80 mt-1">
                  Công việc này dự kiến sẽ gửi lời mời / nhận diện ưu tiên đến cá nhân bạn chọn sau khi đăng. Việc hiển thị cho người khác tùy vào thiết lập tương lai.
                </p>
              </div>
            </div>
          )}

          {/* Upgrade prompt - only shows when quota is low */}
          <div className="mb-6">
            <UpgradePrompt />
          </div>

          <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Lượt đăng bài tháng này
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {isEntitlementsLoading
                    ? "Đang tải thông tin gói..."
                    : hasUnlimitedMonthlyPosts
                      ? "Gói hiện tại cho phép đăng bài không giới hạn."
                      : typeof monthlyPostRemaining === "number"
                        ? `Bạn còn ${monthlyPostRemaining} lượt đăng trong tháng này.`
                        : "Chưa có thông tin giới hạn đăng bài."}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-xl px-4 py-2 text-center text-sm font-semibold",
                  isOutOfMonthlyPosts
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700",
                )}
              >
                {hasUnlimitedMonthlyPosts
                  ? "Không giới hạn"
                  : typeof monthlyPostRemaining === "number"
                    ? `${monthlyPostRemaining} lượt còn lại`
                    : "--"}
              </div>
            </div>
            {!hasUnlimitedMonthlyPosts &&
              typeof monthlyPostUsed === "number" &&
              typeof monthlyPostLimit === "number" && (
                <div className="mt-3 text-xs text-gray-400">
                  Đã dùng {monthlyPostUsed}/{monthlyPostLimit} lượt đăng bài.
                </div>
              )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Type Selector */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">✦</span>
                </div>
                Loại công việc
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: JobType.GIG,
                    icon: "⚡",
                    label: "Thời vụ",
                    desc: "1 lần, ngắn hạn",
                    color: "orange",
                  },
                  {
                    value: JobType.ONLINE,
                    icon: "🌐",
                    label: "Online",
                    desc: "Từ xa, deliverable",
                    color: "cyan",
                  },
                ].map((type) => {
                  const isSelected = form.jobType === type.value;
                  const colorMap: Record<string, { border: string; bg: string; text: string; ring: string }> = {
                    orange: {
                      border: "border-orange-400",
                      bg: "bg-orange-50",
                      text: "text-orange-700",
                      ring: "ring-orange-200",
                    },
                    purple: {
                      border: "border-purple-400",
                      bg: "bg-purple-50",
                      text: "text-purple-700",
                      ring: "ring-purple-200",
                    },
                    cyan: {
                      border: "border-cyan-400",
                      bg: "bg-cyan-50",
                      text: "text-cyan-700",
                      ring: "ring-cyan-200",
                    },
                  };
                  const c = colorMap[type.color];
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateForm("jobType", type.value)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        isSelected
                          ? `${c.border} ${c.bg} ring-2 ${c.ring} shadow-sm`
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
                      )}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div
                        className={cn(
                          "font-semibold text-sm",
                          isSelected ? c.text : "text-gray-800",
                        )}
                      >
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {type.desc}
                      </div>
                      {isSelected && (
                        <div
                          className={`absolute top-2 right-2 w-5 h-5 rounded-full ${c.bg} ${c.text} flex items-center justify-center`}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">$</span>
                </div>
                Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateForm("paymentMethod", PaymentMethod.P2P)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    form.paymentMethod === PaymentMethod.P2P
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
                  )}
                >
                  <div className="text-xl mb-2">🤝</div>
                  <div className={cn("font-semibold text-sm", form.paymentMethod === PaymentMethod.P2P ? "text-blue-700" : "text-gray-800")}>
                    Thanh toán trực tiếp
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Hai bên tự thoả thuận chuyển khoản ngân hàng. Website không thu phí trung gian.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateForm("paymentMethod", PaymentMethod.ESCROW);
                    if (form.salaryType === "HOURLY") {
                      updateForm("salaryType", "FIXED");
                    }
                    if (form.onlinePaymentType === OnlinePaymentType.HOURLY_RATE) {
                      updateForm("onlinePaymentType", OnlinePaymentType.FIXED_PRICE);
                    }
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    form.paymentMethod === PaymentMethod.ESCROW
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
                  )}
                >
                  <div className="text-xl mb-2">🛡️</div>
                  <div className={cn("font-semibold text-sm", form.paymentMethod === PaymentMethod.ESCROW ? "text-emerald-700" : "text-gray-800")}>
                    Qua nền tảng (Escrow)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Bạn thanh toán trước cho website giữ tiền (an toàn 100%). Website sẽ giải ngân khi hoàn thành.
                  </div>
                </button>
              </div>
            </div>

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
                  placeholder={titlePlaceholder}
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
                  placeholder={descPlaceholder}
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

            {/* Salary & Time - Hidden for ONLINE */}
            {form.jobType !== JobType.ONLINE && (
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
                    {form.paymentMethod !== PaymentMethod.ESCROW && <option value="HOURLY">Theo giờ</option>}
                    <option value="FIXED">Khoán (cố định / công)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Lương (đ/{form.salaryType === "FIXED" ? "công" : "giờ"}){" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.salaryPerHour ? Number(form.salaryPerHour).toLocaleString("vi-VN") : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      updateForm("salaryPerHour", val);
                    }}
                    placeholder="VD: 50.000"
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
                  <label className={labelClass}>Kết thúc (không bắt buộc)</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => updateForm("endTime", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            )}

            {/* Part-time Extra Fields */}
            {form.jobType === JobType.PART_TIME && (
              <div className="bg-white rounded-2xl border border-purple-100 p-6 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-sm">🕐</span>
                  </div>
                  Thông tin Part-time
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Thời hạn hợp đồng
                    </label>
                    <input
                      type="text"
                      value={form.contractDuration}
                      onChange={(e) => updateForm("contractDuration", e.target.value)}
                      placeholder="VD: 3 tháng, không xác định"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Lịch làm việc
                    </label>
                    <input
                      type="text"
                      value={form.workSchedule}
                      onChange={(e) => updateForm("workSchedule", e.target.value)}
                      placeholder="VD: T2-T6, 8h-12h"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Ghi chú thanh toán
                  </label>
                  <input
                    type="text"
                    value={form.paymentNote}
                    onChange={(e) => updateForm("paymentNote", e.target.value)}
                    placeholder="VD: Trả vào ngày 5 hàng tháng"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Online Fields (Upwork-style) */}
            {form.jobType === JobType.ONLINE && (
              <div className="bg-white rounded-2xl border border-cyan-100 p-6 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <span className="text-sm">🌐</span>
                  </div>
                  Thông tin dự án Online
                </h2>

                <div>
                  <label className={labelClass}>Phạm vi công việc (Scope)</label>
                  <input
                    type="text"
                    value={form.projectScope}
                    onChange={(e) => updateForm("projectScope", e.target.value)}
                    placeholder="VD: Xây dựng landing page cho sự kiện..."
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Hình thức thanh toán</label>
                    <select
                      value={form.onlinePaymentType}
                      onChange={(e) => updateForm("onlinePaymentType", e.target.value)}
                      className={inputClass}
                    >
                      <option value={OnlinePaymentType.FIXED_PRICE}>Khoán toàn bộ (Fixed-price)</option>
                      {form.paymentMethod !== PaymentMethod.ESCROW && <option value={OnlinePaymentType.HOURLY_RATE}>Trả theo giờ (Hourly-rate)</option>}
                    </select>
                  </div>
                  {form.onlinePaymentType === OnlinePaymentType.FIXED_PRICE ? (
                    <div>
                      <label className={labelClass}>Ngân sách dự kiến (đ)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={form.totalBudget ? Number(form.totalBudget).toLocaleString("vi-VN") : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          updateForm("totalBudget", val);
                        }}
                        placeholder="VD: 5.000.000"
                        className={inputClass}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className={labelClass}>Rate tối thiểu (đ/h)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={form.hourlyRateMin ? Number(form.hourlyRateMin).toLocaleString("vi-VN") : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateForm("hourlyRateMin", val);
                          }}
                          placeholder="VD: 100.000"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex-1">
                        <label className={labelClass}>Rate tối đa (đ/h)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.hourlyRateMax ? Number(form.hourlyRateMax).toLocaleString("vi-VN") : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateForm("hourlyRateMax", val);
                          }}
                          placeholder="VD: 500.000"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Deadline</label>
                    <input
                      type="datetime-local"
                      value={form.deadline}
                      onChange={(e) => updateForm("deadline", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Yêu cầu kinh nghiệm</label>
                    <select
                      value={form.experienceLevel}
                      onChange={(e) => updateForm("experienceLevel", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Không yêu cầu</option>
                      <option value={ExperienceLevel.ENTRY}>Mới bắt đầu (Junior)</option>
                      <option value={ExperienceLevel.INTERMEDIATE}>Có kinh nghiệm (Mid)</option>
                      <option value={ExperienceLevel.EXPERT}>Chuyên gia (Senior)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Loại sản phẩm bàn giao</label>
                    <select
                      value={form.deliverableType}
                      onChange={(e) => updateForm("deliverableType", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Chọn loại</option>
                      <option value="FILE">File (Thiết kế, Docs...)</option>
                      <option value="LINK">Link (Web, Demo...)</option>
                      <option value="CODE">Source Code</option>
                      <option value="TEXT">Văn bản (Dịch thuật...)</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>
              </div>
            )}


            {/* Location - Hidden for ONLINE */}
            {form.jobType !== JobType.ONLINE && (
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
                    addressQuery={
                      form.wardCode && form.provinceCode
                        ? `${wards.find(w => w.code === form.wardCode)?.name || ""}, ${provinces.find(p => p.code === form.provinceCode)?.name || ""}, Việt Nam`
                        : form.provinceCode
                        ? `${provinces.find(p => p.code === form.provinceCode)?.name || ""}, Việt Nam`
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
            )}

            {/* Skills */}
            {filteredSkills.length > 0 && (
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
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all cursor-pointer",
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
                disabled={isSubmitting || isOutOfMonthlyPosts}
                className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 transition-all"
              >
                {isSubmitting
                  ? "Đang đăng..."
                  : isOutOfMonthlyPosts
                    ? "Đã hết lượt đăng"
                    : "Đăng tuyển"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </AuthGuard>
  );
}
