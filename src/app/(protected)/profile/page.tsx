"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts";
import { userService, UpdateUserRequest } from "@/services/user.service";
import { profileService, locationService, skillService } from "@/services";
import { useUpload } from "@/hooks";
import { AuthGuard } from "@/components";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PrivacySettingsPanel } from "@/components/profile";
import { SearchableCombobox } from "@/components/common/searchable-combobox";
import {
  ApiError,
  WorkerProfile,
  EmployerProfile,
  Skill,
  Province,
  Ward,
  CreateWorkerProfileRequest,
  CreateEmployerProfileRequest,
  WorkerPrivacySettings,
  EmployerPrivacySettings,
  Role,
  VerificationLevel,
} from "@/types";
import { getErrorMessage } from "@/lib";

type ProfileTab = "account" | "worker" | "employer";

const PROFILE_TABS: { key: ProfileTab; label: string; icon: string }[] = [
  {
    key: "account",
    label: "Tài khoản",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    key: "worker",
    label: "Người lao động",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    key: "employer",
    label: "Nhà tuyển dụng",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
];

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");

  // Account state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Worker profile state
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(
    null,
  );
  const [workerLoading, setWorkerLoading] = useState(false);
  const [workerForm, setWorkerForm] = useState<CreateWorkerProfileRequest>({});

  // Employer profile state
  const [employerProfile, setEmployerProfile] =
    useState<EmployerProfile | null>(null);
  const [employerLoading, setEmployerLoading] = useState(false);
  const [employerForm, setEmployerForm] =
    useState<CreateEmployerProfileRequest>({});

  // Shared location & skills data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [workerSection, setWorkerSection] = useState<"details" | "privacy">(
    "details",
  );
  const [employerSection, setEmployerSection] = useState<"details" | "privacy">(
    "details",
  );

  const provinceComboboxOptions = useMemo(
    () => [
      { value: "", label: "Chọn tỉnh/thành" },
      ...provinces.map((p) => ({ value: p.code, label: p.fullName })),
    ],
    [provinces],
  );

  const wardComboboxOptions = useMemo(
    () => [
      { value: "", label: "Chọn quận/huyện" },
      ...wards.map((w) => ({ value: w.code, label: w.fullName })),
    ],
    [wards],
  );

  const { upload, isUploading } = useUpload({
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSize: 5 * 1024 * 1024,
    onSuccess: async (url) => {
      try {
        await userService.updateProfile({ avatarUrl: url });
        await refreshUser();
        setSuccess("Cập nhật ảnh đại diện thành công");
      } catch (err) {
        setError(getErrorMessage(err as ApiError) || "Lỗi cập nhật ảnh");
      }
    },
    onError: (err) => setError(err.message),
  });

  // Load shared data
  useEffect(() => {
    locationService
      .getProvinces()
      .then(setProvinces)
      .catch(() => {});
    skillService
      .getAll()
      .then(setAllSkills)
      .catch(() => {});
  }, []);

  // Load worker profile when tab activates
  useEffect(() => {
    if (activeTab === "worker" && !workerProfile) {
      setWorkerLoading(true);
      profileService
        .getWorkerProfile()
        .then((p) => {
          setWorkerProfile(p);
          setWorkerForm({
            bio: p.bio || "",
            phone: p.phone || "",
            dateOfBirth: p.dateOfBirth?.split("T")[0] || "",
            provinceCode: p.provinceCode || "",
            wardCode: p.wardCode || "",
            address: p.address || "",
          });
          setSelectedSkillIds(p.workerSkills?.map((ws) => ws.skillId) || []);
          if (p.provinceCode) {
            locationService
              .getProvinceWithWards(p.provinceCode)
              .then((prov) => setWards(prov.wards));
          }
        })
        .catch(() => {})
        .finally(() => setWorkerLoading(false));
    }
  }, [activeTab, workerProfile]);

  // Load employer profile when tab activates
  useEffect(() => {
    if (activeTab === "employer" && !employerProfile) {
      setEmployerLoading(true);
      profileService
        .getEmployerProfile()
        .then((p) => {
          setEmployerProfile(p);
          setEmployerForm({
            companyName: p.companyName || "",
            companyDescription: p.companyDescription || "",
            phone: p.phone || "",
            provinceCode: p.provinceCode || "",
            wardCode: p.wardCode || "",
            address: p.address || "",
          });
          if (p.provinceCode) {
            locationService
              .getProvinceWithWards(p.provinceCode)
              .then((prov) => setWards(prov.wards));
          }
        })
        .catch(() => {})
        .finally(() => setEmployerLoading(false));
    }
  }, [activeTab, employerProfile]);

  const handleWorkerProvinceChange = async (code: string) => {
    setWorkerForm((prev) => ({
      ...prev,
      provinceCode: code,
      wardCode: "",
    }));

    if (code) {
      const prov = await locationService.getProvinceWithWards(code);
      setWards(prov.wards);
    } else {
      setWards([]);
    }
  };

  const handleEmployerProvinceChange = async (code: string) => {
    setEmployerForm((prev) => ({
      ...prev,
      provinceCode: code,
      wardCode: "",
    }));

    if (code) {
      const prov = await locationService.getProvinceWithWards(code);
      setWards(prov.wards);
    } else {
      setWards([]);
    }
  };

  // ========== Account Handlers ==========
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      await userService.updateProfile(formData as UpdateUserRequest);
      await refreshUser();
      setSuccess("Cập nhật tài khoản thành công");
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err as ApiError) || "Lỗi cập nhật tài khoản");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError("");
      setSuccess("");
      await upload(file);
    }
  };

  // ========== Worker Handlers ==========
  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const payload = { ...workerForm, skillIds: selectedSkillIds };
      if (workerProfile) {
        const updated = await profileService.updateWorkerProfile(payload);
        setWorkerProfile(updated);
      } else {
        const created = await profileService.createWorkerProfile(payload);
        setWorkerProfile(created);
      }
      setSuccess("Cập nhật hồ sơ người lao động thành công");
    } catch (err) {
      setError(getErrorMessage(err as ApiError) || "Lỗi cập nhật hồ sơ");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== Employer Handlers ==========
  const handleEmployerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      if (employerProfile) {
        const updated =
          await profileService.updateEmployerProfile(employerForm);
        setEmployerProfile(updated);
      } else {
        const created =
          await profileService.createEmployerProfile(employerForm);
        setEmployerProfile(created);
      }
      setSuccess("Cập nhật hồ sơ nhà tuyển dụng thành công");
    } catch (err) {
      setError(getErrorMessage(err as ApiError) || "Lỗi cập nhật hồ sơ");
    } finally {
      setIsLoading(false);
    }
  };

  const visibleTabKeys = useMemo<ProfileTab[]>(() => {
    if (user?.role === Role.ORGANIZATION) {
      return ["account", "employer"];
    }

    if (user?.role === Role.ADMIN) {
      return ["account"];
    }

    return ["account", "worker"];
  }, [user?.role]);

  const visibleTabs = useMemo(
    () => PROFILE_TABS.filter((tab) => visibleTabKeys.includes(tab.key)),
    [visibleTabKeys],
  );

  useEffect(() => {
    if (!visibleTabKeys.includes(activeTab)) {
      setActiveTab("account");
    }
  }, [activeTab, visibleTabKeys]);

  useEffect(() => {
    if (searchParams.get("ekyc") === "success") {
      setSuccess("Xác thực eKYC thành công. Tài khoản đã được cập nhật.");
      void refreshUser();
    }
  }, [refreshUser, searchParams]);

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder:text-gray-400 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  const ekycVerified =
    user?.verificationLevel === VerificationLevel.BASIC ||
    user?.verificationLevel === VerificationLevel.BUSINESS;

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-white border-b border-blue-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-200">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-blue-200 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 flex items-center justify-center transition-all shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUploading}
                    title="Chọn ảnh đại diện"
                  />
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {user?.role}
                  </span>
                  {ekycVerified ? (
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      ✓ Đã xác minh
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Alerts */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-blue-50/50 rounded-2xl p-1 mb-6 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setError("");
                  setSuccess("");
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={tab.icon}
                  />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== ACCOUNT TAB ==================== */}
          {activeTab === "account" && (
            <div className="bg-white rounded-2xl border border-blue-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                Thông tin tài khoản
              </h2>
              {isEditing ? (
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Họ</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="Họ"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tên</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Tên"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 disabled:opacity-50 transition-all"
                    >
                      {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Huỷ
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                        Họ
                      </p>
                      <p className="font-medium text-gray-900">
                        {user?.firstName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                        Tên
                      </p>
                      <p className="font-medium text-gray-900">
                        {user?.lastName}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                      Email
                    </p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                      });
                      setIsEditing(true);
                    }}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all"
                  >
                    Chỉnh sửa
                  </button>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          Xác thực eKYC
                        </p>
                        <p className="mt-1 text-xs text-blue-700">
                          {ekycVerified
                            ? "Tài khoản đã xác thực eKYC"
                            : "Bạn chưa xác thực eKYC. Hãy xác thực để mở thêm quyền đăng việc và tăng độ tin cậy."}
                        </p>
                      </div>
                      <Link
                        href="/ekyc"
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        {ekycVerified ? "Xác thực lại" : "Xác thực ngay"}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== WORKER TAB ==================== */}
          {activeTab === "worker" && (
            <div className="bg-white rounded-2xl border border-blue-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Hồ sơ người lao động
                  </h2>
                  {workerProfile && (
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setWorkerSection("details")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          workerSection === "details"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Thông tin hồ sơ
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkerSection("privacy")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          workerSection === "privacy"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Quyền riêng tư
                      </button>
                    </div>
                  )}
                </div>
                {workerProfile && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-500">⭐</span>{" "}
                      {workerProfile.ratingAvg
                        ? Number(workerProfile.ratingAvg).toFixed(1)
                        : "0.0"}{" "}
                      ({workerProfile.totalReviews})
                    </span>
                    <span className="w-px h-4 bg-gray-300"></span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-500">✅</span>{" "}
                      {workerProfile.totalJobsCompleted} việc
                    </span>
                  </div>
                )}
              </div>

              {workerLoading ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-blue-50 rounded-xl" />
                  ))}
                </div>
              ) : workerProfile && workerSection === "privacy" ? (
                <PrivacySettingsPanel
                  role="worker"
                  initialSettings={workerProfile.privacySettings}
                  onSave={async (settings) => {
                    try {
                      const updated = await profileService.updateWorkerProfile({
                        ...workerForm,
                        skillIds: selectedSkillIds,
                        privacySettings: settings as WorkerPrivacySettings,
                      });
                      setWorkerProfile(updated);
                    } catch (err) {
                      setError(
                        getErrorMessage(err as ApiError) ||
                          "Lỗi lưu quyền riêng tư",
                      );
                      throw err;
                    }
                  }}
                />
              ) : (
                <form onSubmit={handleWorkerSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Giới thiệu bản thân</label>
                    <textarea
                      rows={3}
                      value={workerForm.bio || ""}
                      onChange={(e) =>
                        setWorkerForm((p) => ({ ...p, bio: e.target.value }))
                      }
                      placeholder="Mô tả ngắn về kinh nghiệm và kỹ năng..."
                      className={inputClass + " resize-none"}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Số điện thoại</label>
                      <input
                        type="tel"
                        value={workerForm.phone || ""}
                        onChange={(e) =>
                          setWorkerForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="0912 345 678"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Ngày sinh</label>
                      <input
                        type="date"
                        value={workerForm.dateOfBirth || ""}
                        onChange={(e) =>
                          setWorkerForm((p) => ({
                            ...p,
                            dateOfBirth: e.target.value,
                          }))
                        }
                        title="Ngày sinh"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Tỉnh / Thành phố</label>
                      <SearchableCombobox
                        options={provinceComboboxOptions}
                        value={workerForm.provinceCode || ""}
                        onChange={handleWorkerProvinceChange}
                        placeholder="Chọn tỉnh/thành"
                        searchPlaceholder="Tìm tỉnh/thành..."
                        buttonClassName={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Quận / Huyện</label>
                      <SearchableCombobox
                        options={wardComboboxOptions}
                        value={workerForm.wardCode || ""}
                        onChange={(code) =>
                          setWorkerForm((p) => ({ ...p, wardCode: code }))
                        }
                        placeholder="Chọn quận/huyện"
                        searchPlaceholder="Tìm quận/huyện..."
                        disabled={!workerForm.provinceCode}
                        buttonClassName={
                          inputClass +
                          (!workerForm.provinceCode ? " opacity-50" : "")
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Địa chỉ chi tiết</label>
                    <input
                      type="text"
                      value={workerForm.address || ""}
                      onChange={(e) =>
                        setWorkerForm((p) => ({
                          ...p,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Số nhà, đường, phường..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Kỹ năng</label>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.map((skill) => {
                        const isSelected = selectedSkillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() =>
                              setSelectedSkillIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== skill.id)
                                  : [...prev, skill.id],
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                                : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                            }`}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                      {allSkills.length === 0 && (
                        <p className="text-sm text-gray-400">
                          Chưa có kỹ năng nào trong hệ thống
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 disabled:opacity-50 transition-all"
                  >
                    {isLoading
                      ? "Đang lưu..."
                      : workerProfile
                        ? "Cập nhật hồ sơ"
                        : "Tạo hồ sơ"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==================== EMPLOYER TAB ==================== */}
          {activeTab === "employer" && (
            <div className="bg-white rounded-2xl border border-blue-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Hồ sơ nhà tuyển dụng
                  </h2>
                  {employerProfile && (
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setEmployerSection("details")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          employerSection === "details"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Thông tin hồ sơ
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmployerSection("privacy")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          employerSection === "privacy"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Quyền riêng tư
                      </button>
                    </div>
                  )}
                </div>
                {employerProfile && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-500">⭐</span>{" "}
                      {Number(employerProfile.ratingAvg || 0).toFixed(1)} (
                      {employerProfile.totalReviews})
                    </span>
                    <span className="w-px h-4 bg-gray-300"></span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-blue-500">📋</span>{" "}
                      {employerProfile.totalJobsPosted} việc đã đăng
                    </span>
                  </div>
                )}
              </div>

              {employerLoading ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-blue-50 rounded-xl" />
                  ))}
                </div>
              ) : employerProfile && employerSection === "privacy" ? (
                <PrivacySettingsPanel
                  role="employer"
                  initialSettings={employerProfile.privacySettings}
                  onSave={async (settings) => {
                    try {
                      const updated =
                        await profileService.updateEmployerProfile({
                          ...employerForm,
                          privacySettings: settings as EmployerPrivacySettings,
                        });
                      setEmployerProfile(updated);
                    } catch (err) {
                      setError(
                        getErrorMessage(err as ApiError) ||
                          "Lỗi lưu quyền riêng tư",
                      );
                      throw err;
                    }
                  }}
                />
              ) : (
                <form onSubmit={handleEmployerSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Tên công ty / Tổ chức</label>
                    <input
                      type="text"
                      value={employerForm.companyName || ""}
                      onChange={(e) =>
                        setEmployerForm((p) => ({
                          ...p,
                          companyName: e.target.value,
                        }))
                      }
                      placeholder="VD: Công ty TNHH ABC"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Mô tả công ty</label>
                    <textarea
                      rows={3}
                      value={employerForm.companyDescription || ""}
                      onChange={(e) =>
                        setEmployerForm((p) => ({
                          ...p,
                          companyDescription: e.target.value,
                        }))
                      }
                      placeholder="Lĩnh vực hoạt động, quy mô..."
                      className={inputClass + " resize-none"}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Số điện thoại liên hệ</label>
                    <input
                      type="tel"
                      value={employerForm.phone || ""}
                      onChange={(e) =>
                        setEmployerForm((p) => ({
                          ...p,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="0912 345 678"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Tỉnh / Thành phố</label>
                      <SearchableCombobox
                        options={provinceComboboxOptions}
                        value={employerForm.provinceCode || ""}
                        onChange={handleEmployerProvinceChange}
                        placeholder="Chọn tỉnh/thành"
                        searchPlaceholder="Tìm tỉnh/thành..."
                        buttonClassName={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Quận / Huyện</label>
                      <SearchableCombobox
                        options={wardComboboxOptions}
                        value={employerForm.wardCode || ""}
                        onChange={(code) =>
                          setEmployerForm((p) => ({ ...p, wardCode: code }))
                        }
                        placeholder="Chọn quận/huyện"
                        searchPlaceholder="Tìm quận/huyện..."
                        disabled={!employerForm.provinceCode}
                        buttonClassName={
                          inputClass +
                          (!employerForm.provinceCode ? " opacity-50" : "")
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Địa chỉ chi tiết</label>
                    <input
                      type="text"
                      value={employerForm.address || ""}
                      onChange={(e) =>
                        setEmployerForm((p) => ({
                          ...p,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Số nhà, đường, phường..."
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-md hover:shadow-blue-200 disabled:opacity-50 transition-all"
                  >
                    {isLoading
                      ? "Đang lưu..."
                      : employerProfile
                        ? "Cập nhật hồ sơ"
                        : "Tạo hồ sơ"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
