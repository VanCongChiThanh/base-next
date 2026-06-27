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
    { value: jobs, suffix: "+", label: "Công việc" },
    { value: workers, suffix: "+", label: "Người tìm việc" },
    { value: cities, suffix: "", label: "Tỉnh/thành phố" },
    { value: satisfaction, suffix: "%", label: "Hài lòng" },
  ];

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-600 mb-2 tabular-nums">
                {stat.value >= 1000 ? `${Math.floor(stat.value / 1000)}K` : stat.value}{stat.suffix}
              </p>
              <p className="text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
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
        <section className="pt-8 pb-16 bg-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto relative">
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] md:rounded-[3.5rem] pt-12 md:pt-20 px-4 md:px-12 flex flex-col items-center overflow-hidden">
              {/* Background Watermark/Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] text-white" fill="currentColor">
                  <path d="M50 0 L100 50 L50 100 L0 50 Z" />
                  <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] font-semibold text-white text-center leading-tight max-w-4xl relative z-10 mb-8 md:mb-16">
                Kết nối việc làm thời vụ dễ dàng, nhanh chóng và an toàn
              </h1>

              <div className="relative w-full max-w-5xl mt-4 md:mt-8 flex justify-center pb-12 md:pb-24">
                {/* Main Image Container */}
                <div className="relative z-10 w-full max-w-[800px] h-[250px] sm:h-[350px] md:h-[400px] rounded-t-3xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-end justify-center">
                  <img src="/img/landing/hero-main.jpg" alt="Professionals" className="w-full h-full object-cover object-top opacity-90 mix-blend-luminosity" />
                </div>

                {/* Floating Card Left */}
                <div className="absolute left-0 md:left-[-2rem] lg:left-[-4rem] top-[10%] md:top-[20%] z-20 bg-white rounded-[1.5rem] shadow-xl p-4 md:p-5 w-[200px] md:w-[240px] hidden sm:block transform transition-transform hover:-translate-y-2 border border-gray-100">
                  <div className="flex items-center gap-1 text-sm font-semibold mb-3 text-gray-700">
                    <span className="text-yellow-400">★</span> 5.0
                  </div>
                  <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                      <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Nguyễn Thị Mai" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <h3 className="font-bold text-center text-xs md:text-sm mb-1 uppercase tracking-wider text-gray-800">Nguyễn Thị Mai</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 text-center mb-4 h-8 md:h-10 line-clamp-2">Reader Tarot & Tư vấn tâm lý online</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 md:py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-blue-500/30">
                    Thuê Ngay
                  </button>
                </div>

                {/* Floating Card Right */}
                <div className="absolute right-0 md:right-[-2rem] lg:right-[-4rem] top-[30%] md:top-[40%] z-20 bg-white rounded-[1.5rem] shadow-xl p-4 md:p-5 w-[200px] md:w-[240px] hidden sm:block transform transition-transform hover:-translate-y-2 border border-gray-100">
                  <div className="flex items-center gap-1 text-sm font-semibold mb-3 text-gray-700">
                    <span className="text-yellow-400">★</span> 5.0
                  </div>
                  <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                      <img src="/img/landing/cat-serving.jpg" alt="Nhà hàng Ocean" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <h3 className="font-bold text-center text-xs md:text-sm mb-1 uppercase tracking-wider text-gray-800">Nhà hàng Ocean</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 text-center mb-4 h-8 md:h-10 line-clamp-2">Phục vụ nhà hàng tiệc cưới cuối tuần</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 md:py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-blue-500/30">
                    Ứng Tuyển
                  </button>
                </div>
              </div>
            </div>
            
            {/* Search Bar Container */}
            <div className="relative -mt-8 sm:-mt-12 md:-mt-14 z-30 max-w-[95%] md:max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center bg-white rounded-3xl md:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 md:p-2.5 gap-2 md:gap-3 border border-gray-100">
                
                {/* Location Input */}
                <div className="flex-1 flex items-center bg-gray-100/50 hover:bg-gray-100 md:bg-transparent md:hover:bg-transparent rounded-full md:rounded-none px-5 py-3 w-full transition-all">
                  <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Địa điểm" 
                    className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500 text-sm md:text-base focus:ring-0 px-0"
                  />
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                {/* Job Title Input */}
                <div className="flex-[1.5] flex items-center bg-gray-100/50 hover:bg-gray-100 md:bg-transparent md:hover:bg-transparent rounded-full md:rounded-none px-5 py-3 w-full transition-all">
                  <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Tìm việc: Phục vụ, thiết kế website, tarot..." 
                    className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500 text-sm md:text-base focus:ring-0 px-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Menu Icon */}
                <div className="px-3 hidden md:flex items-center justify-center">
                   <svg className="w-6 h-6 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                   </svg>
                </div>

                {/* Search Button */}
                <button type="submit" className="w-full md:w-[120px] bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 md:p-0 md:h-[60px] rounded-full transition-all flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 hover:shadow-lg mt-2 md:mt-0 font-medium">
                  <span className="md:block hidden">Tìm kiếm</span>
                  <span className="md:hidden font-medium text-base">Tìm kiếm</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Section 2: Categories */}
        <section className="py-20 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Ứng viên sẵn sàng cho mọi công việc tại</h2>
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
                    Xem hồ sơ ứng viên <span aria-hidden="true">&rarr;</span>
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
        <section className="py-24 bg-gray-50/50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Cách hoạt động</h2>
              <p className="mt-4 text-gray-500 text-lg">3 bước đơn giản để bắt đầu cùng GigWork</p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
              {/* Subtle connecting line */}
              <div className="hidden md:block absolute top-[2.5rem] left-[20%] right-[20%] h-[1px] bg-gray-200" />
              
              {[
                { step: "1", title: "Tạo hồ sơ", desc: "Đăng ký và hoàn thiện hồ sơ cá nhân với kỹ năng, kinh nghiệm của bạn.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                { step: "2", title: "Tìm & ứng tuyển", desc: "Duyệt danh sách việc làm, lọc theo khu vực & danh mục, nộp đơn nhanh chóng.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                { step: "3", title: "Làm việc & nhận tiền", desc: "Hoàn thành công việc, nhận đánh giá tốt và xây dựng uy tín trên nền tảng.", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
              ].map((item) => (
                <AnimatedSection key={item.step} className="relative z-10">
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center mb-6 relative transition-all duration-300 group-hover:shadow-md group-hover:border-blue-200 group-hover:-translate-y-1">
                      <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex items-center justify-center border-4 border-white">{item.step}</span>
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed max-w-[280px] mx-auto">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: CTA */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="bg-blue-600 rounded-[2.5rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-600/20">
                {/* Clean, subtle pattern instead of loud blurs */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Sẵn sàng bắt đầu?</h2>
                  <p className="text-blue-100 mb-10 text-lg md:text-xl max-w-2xl mx-auto">
                    Tham gia hàng ngàn người đang sử dụng GigWork mỗi ngày để tìm việc và tuyển dụng.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {!isAuthenticated ? (
                      <>
                        <Link href="/register" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                          Đăng ký miễn phí
                        </Link>
                        <Link href="/jobs" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors">
                          Xem việc làm
                        </Link>
                      </>
                    ) : (
                      <Link href="/jobs" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                        Khám phá việc làm →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
