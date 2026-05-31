"use client";

import { useAuth } from "@/contexts";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useEffect, useRef, useState } from "react";

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

export default function HomePageClient() {
  const { isAuthenticated, isLoading } = useAuth();

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
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: float2 8s ease-in-out infinite; }
        .float-3 { animation: float 7s ease-in-out infinite 2s; }
        .shimmer-text {
          background: linear-gradient(90deg, #2563eb, #0ea5e9, #8b5cf6, #2563eb);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 40%, #faf5ff 100%);
          background-size: 400% 400%;
          animation: gradient-shift 8s ease infinite;
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-hover:hover {
          transform: translateY(-6px) scale(1.01);
        }
        .pulse-dot::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          animation: pulse-ring 2s ease-out infinite;
          background: currentColor;
          opacity: 0.4;
        }
      `}</style>

      <Navbar />
      <main className="flex-1 overflow-hidden">

        {/* ── Hero ── */}
        <section className="relative hero-gradient min-h-[92vh] flex items-center overflow-hidden">
          {/* Animated blobs */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl float-1 pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl float-2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-200/10 rounded-full blur-3xl pointer-events-none" />

          {/* Floating shapes */}
          <div className="absolute top-24 right-[15%] w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-200/50 backdrop-blur-sm float-1 hidden lg:block" />
          <div className="absolute bottom-32 left-[12%] w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-200/50 backdrop-blur-sm float-3 hidden lg:block" />
          <div className="absolute top-1/3 right-[8%] w-8 h-8 rounded-lg bg-emerald-500/20 float-2 hidden lg:block" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm text-sm font-medium text-blue-700 mb-8 hover:scale-105 transition-transform cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Nền tảng việc làm thời vụ #1 Việt Nam
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
                <span className="text-gray-900">Tìm việc làm </span>
                <span className="shimmer-text">thời vụ</span>
                <br />
                <span className="text-gray-900">nhanh & dễ dàng</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
                Kết nối người tìm việc với nhà tuyển dụng.{" "}
                <span className="font-semibold text-blue-600">Hàng ngàn công việc</span>{" "}
                thời vụ mới mỗi ngày trên khắp Việt Nam.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/jobs"
                  className="group relative w-full sm:w-auto px-10 py-4 text-base font-semibold text-white rounded-2xl overflow-hidden shadow-xl shadow-blue-300/40 hover:shadow-blue-400/50 hover:-translate-y-1 transition-all duration-300"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0284c7)" }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  Tìm việc ngay →
                </Link>
                <Link
                  href="/jobs/post"
                  className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-blue-600 bg-white/80 backdrop-blur-sm border-2 border-blue-100 rounded-2xl hover:bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  Đăng tuyển miễn phí
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
                {["🔒 Bảo mật tuyệt đối", "⚡ Kết nối tức thì", "✅ Xác minh danh tính", "🤖 AI chống lừa đảo"].map(t => (
                  <span key={t} className="flex items-center gap-1 font-medium">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <StatsSection />

        {/* ── How it works ── */}
        <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-4 uppercase tracking-wide">Quy trình</span>
              <h2 className="text-4xl font-bold text-gray-900">Cách hoạt động</h2>
              <p className="mt-3 text-gray-500 text-lg">3 bước đơn giản để bắt đầu</p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-[3.5rem] left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-sky-300 to-emerald-200" />

              {[
                { step: "01", title: "Tạo hồ sơ", desc: "Đăng ký và hoàn thiện hồ sơ cá nhân với kỹ năng, kinh nghiệm của bạn.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "from-blue-500 to-blue-400", delay: "0ms" },
                { step: "02", title: "Tìm & ứng tuyển", desc: "Duyệt danh sách việc làm, lọc theo khu vực & danh mục, nộp đơn nhanh chóng.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", color: "from-sky-500 to-sky-400", delay: "150ms" },
                { step: "03", title: "Làm việc & nhận tiền", desc: "Hoàn thành công việc, nhận đánh giá tốt và xây dựng uy tín trên nền tảng.", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1", color: "from-emerald-500 to-emerald-400", delay: "300ms" },
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


        {/* ── CTA ── */}
        <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb, #0284c7)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl float-2" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl float-1" />
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
