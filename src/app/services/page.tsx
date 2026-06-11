"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { workerServiceAPI, locationService, categoryService } from "@/services";
import { WorkerService, Province, JobCategory } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/contexts";
import { DirectHireModal } from "@/components/services/direct-hire-modal";

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<WorkerService[]>([]);
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);

  // Modal state
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<WorkerService | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    provinceCode: "",
    isAvailableNow: false,
  });

  useEffect(() => {
    Promise.all([
      locationService.getProvinces(),
      categoryService.getAll()
    ])
      .then(([p, c]) => {
        setProvinces(p);
        setCategories(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {

    let cancel = false;
    setLoading(true);

    const query: any = {};
    if (filters.search) query.search = filters.search;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.provinceCode) query.provinceCode = filters.provinceCode;
    if (filters.isAvailableNow) query.isAvailableNow = true;

    workerServiceAPI.findServices(query).then((res) => {
      if (!cancel) setServices(res.data || []);
    }).catch(() => {
      if (!cancel) setServices([]);
    }).finally(() => {
      if (!cancel) setLoading(false);
    });

    return () => { cancel = true; };
  }, [filters]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };


  const renderServiceCard = (service: WorkerService) => {
    // Determine the image to show. If no portfolio, use a standard gradient or placeholder.
    const hasImage = service.portfolioUrls && service.portfolioUrls.length > 0;
    const coverImage = hasImage ? service.portfolioUrls[0] : "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800"; // Fallback professional image

    return (
      <div key={service.id} className="w-full bg-white rounded-3xl shadow-md hover:shadow-xl border border-gray-100 transition-all group flex flex-col overflow-hidden h-[650px] md:h-[600px] relative">
        
        {/* Cover Image Header */}
        <div className="relative h-64 md:h-56 shrink-0 w-full overflow-hidden">
          <img src={coverImage} alt={service.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-bold text-white drop-shadow-md line-clamp-2 leading-tight">
              {service.title}
            </h3>
          </div>
          
          {service.isAvailableNow && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Sẵn sàng làm ngay
              </span>
            </div>
          )}
        </div>

        {/* Card Content Body */}
        <div className="flex-1 p-5 flex flex-col overflow-y-auto hide-scrollbar">
          
          {/* User Info & Badges */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-indigo-100">
              {service.worker?.avatarUrl ? (
                <img src={service.worker.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                  {(service.worker?.firstName?.[0] || 'U')}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{service.worker?.firstName} {service.worker?.lastName}</span>
              {/* Real worker stats (only shown when there is data) */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                {Number(service.worker?.workerProfile?.totalReviews) > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded-md"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> {Number(service.worker?.workerProfile?.ratingAvg).toFixed(1)}</span>
                )}
                {Number(service.worker?.workerProfile?.totalJobsCompleted) > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {Number(service.worker?.workerProfile?.totalJobsCompleted)} việc</span>
                )}
              </div>
            </div>
          </div>

          {/* Location & Price row */}
          <div className="flex items-center justify-between gap-2 mb-4 text-sm bg-gray-50/80 p-3 rounded-xl border border-gray-100">
            <div className="flex flex-col gap-1 max-w-[60%]">
              <span className="text-gray-600 flex items-center gap-1.5 font-medium truncate">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {service.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}
              </span>
              <span className="text-blue-600 bg-blue-50 text-[10px] font-bold px-2 py-0.5 rounded max-w-max">
                 {service.category?.name || "Dịch vụ"}
              </span>
            </div>
            <div className="flex flex-col items-end bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-sm border border-yellow-100">
              <span className="text-base">{Number(service.price).toLocaleString('vi-VN')}đ{service.priceType === 'HOURLY' ? '/giờ' : ''}</span>
              <span className="text-[10px] font-medium opacity-80">(Đề xuất)</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h5 className="font-bold text-gray-900 mb-1">Giới thiệu bản thân</h5>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{service.description}</p>
          </div>

          {/* Category tag */}
          {service.category?.name && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-full">
                {service.category.name}
              </span>
            </div>
          )}
          
          <div className="mt-auto space-y-3">
             <div className="text-xs text-gray-500 flex items-center gap-1.5">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Ngày đăng: {formatRelativeTime(service.createdAt)}
             </div>
          </div>
        </div>

        {/* Footer Fixed Action Button */}
        <div className="p-4 bg-white border-t border-gray-100 mt-auto shrink-0 flex gap-3 pb-safe">
           <Link
             href={`/users/${service.workerId}`}
             className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition"
             title="Xem hồ sơ"
           >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
           </Link>
           {service.workerId !== user?.id && (
             <button
               onClick={() => {
                 setSelectedService(service);
                 setIsHireModalOpen(true);
               }}
               className="flex-1 flex items-center justify-center gap-2 py-3 text-center text-sm font-bold text-white bg-[#007bfe] rounded-2xl hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
             >
               Thuê ngay
             </button>
           )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-indigo-700 via-violet-800 to-indigo-900 pb-20 pt-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl tracking-tight">
              Tìm người làm ngay ⚡
            </h1>
            <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto font-medium">
              Tìm người đang rảnh để làm việc ngay: dọn dẹp, giao hàng, phụ quán...
            </p>

            {/* Search Controls */}
            <div className="mt-8 w-full max-w-3xl mx-auto">
              <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 border border-indigo-50 items-center justify-center max-w-4xl mx-auto w-full">
                <input
                  type="text"
                  placeholder="Từ khóa (chụp ảnh, dọn dẹp...)"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 focus:bg-white border focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100 transition-all outline-none w-full md:w-auto"
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                />
                
                <select
                  className="px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 focus:bg-white border focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-700 w-full md:w-auto md:min-w-[180px]"
                  value={filters.categoryId}
                  onChange={(e) => updateFilter("categoryId", e.target.value)}
                >
                  <option value="">Tất cả lĩnh vực</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select
                  className="px-4 py-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 focus:bg-white border focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-700 w-full md:w-auto md:min-w-[160px]"
                  value={filters.provinceCode}
                  onChange={(e) => updateFilter("provinceCode", e.target.value)}
                >
                  <option value="">Toàn quốc</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>

                <label className="flex items-center gap-2 px-6 py-3 bg-[#eef1fa] border border-transparent rounded-xl cursor-pointer hover:border-indigo-200 transition-all whitespace-nowrap w-full md:w-auto justify-center group">
                  <input
                    type="checkbox"
                    checked={filters.isAvailableNow}
                    onChange={(e) => updateFilter("isAvailableNow", e.target.checked)}
                    className="w-5 h-5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 shadow-inner block"
                  />
                  <span className="text-indigo-800 font-bold group-hover:text-indigo-900 transition-colors">Rảnh ngay</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-64 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100 mt-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 text-indigo-500 mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-ping"></div>
                <svg className="w-10 h-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Chưa tìm thấy ứng viên phù hợp</h3>
              <p className="text-gray-500 mb-8 text-lg">
                Thử thay đổi cấu hình bộ lọc hoặc tìm kiếm bằng từ khoá khác để mở rộng kết quả.
              </p>
              <button onClick={() => setFilters({search: "", categoryId: "", provinceCode: "", isAvailableNow: false})} className="px-8 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition shadow-sm">
                Xoá toàn bộ bộ lọc
              </button>
            </div>
          ) : (
            <>
              {/* Grid hiển thị danh sách ứng viên, tự co giãn 1 cột trên mobile, nhiều cột trên desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10 pt-2">                
                {services.map(renderServiceCard)}
              </div>
            </>
          )}
        </div>
      </main>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      <Footer />
      <DirectHireModal 
        isOpen={isHireModalOpen} 
        onClose={() => {
          setIsHireModalOpen(false);
          setSelectedService(null);
        }} 
        service={selectedService} 
      />
    </>
  );
}
