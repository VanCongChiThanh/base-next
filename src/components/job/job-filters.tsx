"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { JobCategory, Province, ProvinceDetail } from "@/types";
import { categoryService, locationService } from "@/services";
import { useDebounceValue } from "@/hooks/use-debounce-value";
import { cn } from "@/lib/utils";
import { SearchableCombobox } from "@/components/common/searchable-combobox";

interface JobFiltersProps {
  onFilterChange: (filters: {
    search?: string;
    category?: string;
    provinceCode?: string;
    wardCode?: string;
    salaryMin?: number;
    salaryMax?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) => void;
}

export function JobFilters({ onFilterChange }: JobFiltersProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [isNearMe, setIsNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [radius, setRadius] = useState("10");
  const [locationError, setLocationError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<ProvinceDetail["wards"]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedSearch = useDebounceValue(search, 500);

  useEffect(() => {
    categoryService
      .getAll()
      .then(setCategories)
      .catch(() => {});
    locationService
      .getProvinces()
      .then(setProvinces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (provinceCode) {
      locationService
        .getProvinceWithWards(provinceCode)
        .then((data) => setWards(data.wards))
        .catch(() => setWards([]));
    } else {
      setWards([]);
      setWardCode("");
    }
  }, [provinceCode]);

  const applyFilters = useCallback(() => {
    onFilterChange({
      search: debouncedSearch || undefined,
      category: categoryId || undefined,
      provinceCode: provinceCode || undefined,
      wardCode: wardCode || undefined,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      latitude: isNearMe && userLocation ? userLocation.lat : undefined,
      longitude: isNearMe && userLocation ? userLocation.lng : undefined,
      radius: isNearMe ? Number(radius) : undefined,
    });
  }, [
    debouncedSearch,
    categoryId,
    provinceCode,
    wardCode,
    salaryMin,
    salaryMax,
    isNearMe,
    userLocation,
    radius,
    onFilterChange,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setProvinceCode("");
    setWardCode("");
    setSalaryMin("");
    setSalaryMax("");
    setIsNearMe(false);
    setUserLocation(null);
    setLocationError("");
  };

  const hasFilters =
    search ||
    categoryId ||
    provinceCode ||
    wardCode ||
    salaryMin ||
    salaryMax ||
    isNearMe;

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Tất cả danh mục" },
      ...categories.map((c) => ({
        value: c.id,
        label: `${c.icon ?? ""} ${c.name}`.trim(),
      })),
    ],
    [categories],
  );

  const provinceOptions = useMemo(
    () => [
      { value: "", label: "Tất cả tỉnh/thành" },
      ...provinces.map((p) => ({ value: p.code, label: p.fullName })),
    ],
    [provinces],
  );

  const wardOptions = useMemo(
    () => [
      { value: "", label: "Tất cả phường/xã" },
      ...wards.map((w) => ({ value: w.code, label: w.fullName })),
    ],
    [wards],
  );

  const toggleNearMe = () => {
    if (!isNearMe) {
      if (!navigator.geolocation) {
        setLocationError("Trình duyệt không hỗ trợ vị trí");
        return;
      }
      setIsLoadingLocation(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsNearMe(true);
          setIsLoadingLocation(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationError("Vui lòng cấp quyền truy cập vị trí.");
          setIsLoadingLocation(false);
          setIsNearMe(false);
        },
        { timeout: 10000 },
      );
    } else {
      setIsNearMe(false);
      setUserLocation(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm công việc..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-blue-100 bg-blue-50/30 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
        />
      </div>

      {/* Primary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SearchableCombobox
          options={categoryOptions}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Tất cả danh mục"
          searchPlaceholder="Tìm danh mục..."
        />
        <SearchableCombobox
          options={provinceOptions}
          value={provinceCode}
          onChange={(v) => {
            setProvinceCode(v);
            setWardCode("");
          }}
          placeholder="Tất cả tỉnh/thành"
          searchPlaceholder="Tìm tỉnh/thành..."
        />
        <SearchableCombobox
          options={wardOptions}
          value={wardCode}
          onChange={setWardCode}
          placeholder="Tất cả phường/xã"
          searchPlaceholder="Tìm phường/xã..."
          disabled={!provinceCode}
        />
      </div>

      {/* Near Me Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          onClick={toggleNearMe}
          disabled={isLoadingLocation}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all min-w-[140px] justify-center",
            isNearMe
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100",
            isLoadingLocation && "opacity-70 cursor-wait",
          )}
        >
          {isLoadingLocation ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang lấy vị trí...</span>
            </>
          ) : (
            <>
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {isNearMe ? "Đang tìm việc gần tôi" : "Tìm việc gần tôi"}
              </span>
            </>
          )}
        </button>

        {isNearMe && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Bán kính:</span>
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-blue-100 bg-white text-gray-700 text-sm focus:outline-none"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        )}
      </div>

      {locationError && (
        <p className="text-red-500 text-xs mt-1">{locationError}</p>
      )}

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform",
              showAdvanced && "rotate-180",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {showAdvanced ? "Ẩn bộ lọc" : "Bộ lọc nâng cao"}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-50">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Lương tối thiểu (đ/giờ)
            </label>
            <input
              type="number"
              placeholder="VD: 30000"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Lương tối đa (đ/giờ)
            </label>
            <input
              type="number"
              placeholder="VD: 100000"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
}
