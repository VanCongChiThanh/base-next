"use client";

import { useAuth } from "@/contexts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useEffect, useRef, useState } from "react";
import { categoryService } from "@/services";
import { JobCategory } from "@/types";

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const jobs = useCountUp(10000, 1800, started);
  const workers = useCountUp(5000, 1800, started);
  const cities = useCountUp(34, 1800, started);
  const satisfaction = useCountUp(98, 1800, started);

  const stats = [
    { value: jobs, suffix: "+", label: "Công việc", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "from-blue-500 to-sky-400" },
    { value: workers, suffix: "+", label: "Người tìm việc", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "from-violet-500 to-purple-400" },
    { value: cities, suffix: "", label: "Tỉnh/thành phố", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", color: "from-emerald-500 to-teal-400" },
    { value: satisfaction, suffix: "%", label: "Hài lòng", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "from-amber-500 to-orange-400" },
  ];

  return (
    <section className="py-14 bg-white border-y border-blue-50" ref={ref}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 tabular-nums">
                {stat.value >= 1000 ? `${Math.floor(stat.value / 1000)}K` : stat.value}{stat.suffix}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "Giao hàng": "/img/landing/cat-delivery.jpg",
  "Phục vụ nhà hàng": "/img/landing/cat-serving.jpg",
  "Dọn trọ,nhà,văn phòng": "/img/landing/cat-cleaning.jpg",
  "Kho vận": "/img/landing/cat-warehouse.jpg",
  "Trợ giúp sự kiện": "/img/landing/cat-event.jpg",
  "Bán hàng": "/img/landing/cat-sales.jpg",
  "Nhập liệu": "/img/landing/cat-data-entry.jpg",  
  "Lập trình": "/img/landing/cat-coding.jpg",
  "Tin học văn phòng": "/img/landing/cat-office.jpg",
};

const DEFAULT_CATEGORY_IMAGE = "/img/landing/hero-main.jpg";

export default function HomePageClient() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<JobCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "Kết nối nhanh hơn.",
      desc: "Chia sẻ chi tiết về công việc bạn cần và chúng tôi sẽ tìm người phù hợp nhất ngay lập tức.",
      img: "/img/landing/feature-connect.png"
    },
    {
      title: "Chỉ những ứng viên đã xác minh.",
      desc: "Chúng tôi chỉ hiển thị những người đã được xác minh danh tính qua AI để đảm bảo an toàn.",
      img: "/img/landing/feature-verified.png"
    },
    {
      title: "Hoàn thành đúng cam kết — đảm bảo.",
      desc: "Nếu công việc không đúng như đã thỏa thuận, bạn được hoàn tiền qua hệ thống Escrow an toàn.",
      img: "/img/landing/feature-guarantee.png"
    }
  ];

  useEffect(() => {
    categoryService.getAll().then((data) => {
      const filtered = data.filter(c => c.name !== "Khác");
      setCategories(filtered);
      if (filtered.length > 0) {
        setActiveCategory(filtered[0]);
      }
    }).catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/jobs`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 animate-pulse" />
          <span className="text-sm text-gray-400">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .card-hover { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .card-hover:hover { transform: translateY(-6px) scale(1.01); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes textCarouselFix {
          0%, 20% { transform: translateY(0); }
          25%, 45% { transform: translateY(-1.2em); }
          50%, 70% { transform: translateY(-2.4em); }
          75%, 95% { transform: translateY(-3.6em); }
          100% { transform: translateY(-4.8em); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Section 1: Hero */}
        <section className="relative pt-20 pb-0 overflow-hidden bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 text-center leading-[1.2]">
              <div className="mb-2">Tìm việc</div>
              <div className="h-[1.2em] overflow-hidden text-blue-600 block m-0 p-0 relative">
                <div style={{ animation: 'textCarouselFix 12s infinite cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <div className="h-[1.2em] flex items-center justify-center">dọn dẹp,</div>
                  <div className="h-[1.2em] flex items-center justify-center">giao hàng,</div>
                  <div className="h-[1.2em] flex items-center justify-center">phục vụ,</div>
                  <div className="h-[1.2em] flex items-center justify-center">lập trình,</div>
                  <div className="h-[1.2em] flex items-center justify-center">dọn dẹp,</div>
                </div>
              </div>
              <div className="mt-2">dễ dàng.</div>
            </h1>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6 relative">
              <div className="relative flex items-center w-full h-16 rounded-2xl bg-white shadow-xl shadow-blue-100/50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <div className="pl-6 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full h-full pl-4 pr-32 bg-transparent border-none focus:ring-0 text-lg text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="Mô tả công việc bạn cần..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                  Tìm kiếm
                </button>
              </div>
            </form>

            <p className="text-gray-500 font-medium">
              Kết nối người cần việc và người tìm việc nhanh chóng, an toàn và minh bạch
            </p>
          </div>

          <div className="w-full mt-12 px-4 sm:px-12 md:px-24">
            <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] relative mx-auto semi-circle-clip overflow-hidden shadow-2xl">
              <img src="/img/landing/hero-main.jpg" alt="GigWork Heroes" className="w-full h-full object-cover object-center" />
            </div>
          </div>
        </section>

        {/* Section 2: Categories */}
        <section className="py-20 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Chuyên gia cho mọi công việc tại</h2>
            <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mb-10">Khu vực của bạn.</h2>

            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 justify-start lg:justify-center mb-8 gap-2 pb-2">
              {(showAllCategories ? categories : categories.slice(0, 5)).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex flex-col items-center min-w-[90px] p-3 rounded-xl transition-colors shrink-0 ${activeCategory?.id === cat.id ? 'bg-white shadow-sm border-b-2 border-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <span className="text-2xl mb-2">{cat.icon || "✨"}</span>
                  <span className={`text-sm whitespace-nowrap font-medium ${activeCategory?.id === cat.id ? 'text-blue-600' : ''}`}>{cat.name}</span>
                </button>
              ))}
              {categories.length > 5 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="flex flex-col items-center min-w-[90px] p-3 rounded-xl transition-colors hover:bg-gray-100 text-gray-600 shrink-0"
                >
                  <span className="text-2xl mb-2">{showAllCategories ? "➖" : "➕"}</span>
                  <span className="text-sm whitespace-nowrap font-medium">{showAllCategories ? "Thu gọn" : "Xem thêm"}</span>
                </button>
              )}
            </div>

            {/* Active Category Display */}
            {activeCategory && (
              <AnimatedSection className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden relative shadow-xl group cursor-pointer" key={activeCategory.id}>
                <img 
                  src={CATEGORY_IMAGE_MAP[activeCategory.name] || DEFAULT_CATEGORY_IMAGE} 
                  alt={activeCategory.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-8 text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{activeCategory.name}</h3>
                  <Link href={`/jobs?category=${activeCategory.id}`} className="inline-flex items-center gap-2 text-white font-medium hover:text-blue-300 transition-colors">
                    Xem chuyên gia <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </AnimatedSection>
            )}
          </div>
        </section>

        {/* Section 3: Why choose GigWork */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tại sao người dùng yêu thích GigWork.</h2>
              <p className="text-lg text-gray-500">Mỗi ngày, hàng ngàn người dùng GigWork để tìm việc và tuyển dụng — và chúng tôi luôn đồng hành cùng bạn.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                      activeFeature === index
                        ? "border-blue-500 shadow-lg bg-blue-50/50"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md bg-white"
                    }`}
                  >
                    <h3 className={`text-xl font-bold mb-2 ${activeFeature === index ? "text-blue-700" : "text-gray-900"}`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
              <div className="relative h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-50/50 rounded-full blur-3xl" />
                <img 
                  key={activeFeature}
                  src={features[activeFeature].img} 
                  alt={features[activeFeature].title} 
                  className="relative h-[90%] object-contain drop-shadow-2xl z-10 animate-[fadeIn_0.5s_ease-out]" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Explore more projects */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Khám phá thêm việc làm.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Link href="/jobs?type=GIG" className="group relative rounded-3xl overflow-hidden h-[300px] md:h-[400px] shadow-lg">
                <img src="/img/landing/explore-gig.jpg" alt="Việc thời vụ" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Việc thời vụ</h3>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-blue-600 transition-colors">
                    <span aria-hidden="true">&rarr;</span>
                  </div>
                </div>
              </Link>
              <Link href="/jobs?type=ONLINE" className="group relative rounded-3xl overflow-hidden h-[300px] md:h-[400px] shadow-lg">
                <img src="/img/landing/explore-online.jpg" alt="Việc Online" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Việc Online</h3>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-blue-600 transition-colors">
                    <span aria-hidden="true">&rarr;</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 5: Stats */}
        <StatsSection />

        {/* Section 6: How it works */}
        <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-4 uppercase tracking-wide">Quy trình</span>
              <h2 className="text-4xl font-bold text-gray-900">Cách hoạt động</h2>
              <p className="mt-3 text-gray-500 text-lg">3 bước đơn giản để bắt đầu</p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-[3.5rem] left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-sky-300 to-emerald-200" />
              {[
                { step: "01", title: "Tạo hồ sơ", desc: "Đăng ký và hoàn thiện hồ sơ cá nhân với kỹ năng, kinh nghiệm của bạn.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "from-blue-500 to-blue-400" },
                { step: "02", title: "Tìm & ứng tuyển", desc: "Duyệt danh sách việc làm, lọc theo khu vực & danh mục, nộp đơn nhanh chóng.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", color: "from-sky-500 to-sky-400" },
                { step: "03", title: "Làm việc & nhận tiền", desc: "Hoàn thành công việc, nhận đánh giá tốt và xây dựng uy tín trên nền tảng.", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1", color: "from-emerald-500 to-emerald-400" },
              ].map((item) => (
                <AnimatedSection key={item.step}>
                  <div className="card-hover relative bg-white rounded-3xl border border-blue-100/80 p-8 shadow-sm hover:shadow-xl hover:shadow-blue-100/60">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      <span className="text-5xl font-black text-blue-50 select-none">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: CTA */}
        <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0284c7)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-white mb-4">Sẵn sàng bắt đầu?</h2>
              <p className="text-blue-100 mb-10 text-xl">Tham gia hàng ngàn người đang sử dụng GigWork mỗi ngày</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {!isAuthenticated ? (
                  <>
                    <Link href="/register" className="w-full sm:w-auto px-10 py-4 text-base font-bold text-blue-600 bg-white rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                      Đăng ký miễn phí
                    </Link>
                    <Link href="/jobs" className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-2xl hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                      Xem việc làm
                    </Link>
                  </>
                ) : (
                  <Link href="/jobs" className="w-full sm:w-auto px-10 py-4 text-base font-bold text-blue-600 bg-white rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    Khám phá việc làm →
                  </Link>
                )}
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
