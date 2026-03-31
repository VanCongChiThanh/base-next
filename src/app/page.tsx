"use client";

import { useAuth } from "@/contexts";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
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
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-white">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/60 text-blue-700 text-sm font-medium mb-6">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Nền tảng việc làm thời vụ #1 Việt Nam
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                <span className="text-gray-900">Tìm việc làm </span>
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 bg-clip-text text-transparent">
                  thời vụ
                </span>
                <br />
                <span className="text-gray-900">nhanh chóng & dễ dàng</span>
              </h1>

              <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
                Kết nối người tìm việc với nhà tuyển dụng. Hàng ngàn công việc
                thời vụ mới mỗi ngày trên khắp Việt Nam.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/jobs"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all"
                >
                  Tìm việc ngay
                </Link>
                <Link
                  href="/jobs/post"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  Đăng tuyển miễn phí
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white border-y border-blue-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  value: "10K+",
                  label: "Công việc",
                  icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                },
                {
                  value: "5K+",
                  label: "Người tìm việc",
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                },
                {
                  value: "34",
                  label: "Tỉnh/thành phố",
                  icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
                },
                {
                  value: "98%",
                  label: "Hài lòng",
                  icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 mb-3">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={stat.icon}
                      />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Cách hoạt động
              </h2>
              <p className="mt-3 text-gray-500">3 bước đơn giản để bắt đầu</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Tạo hồ sơ",
                  desc: "Đăng ký tài khoản và hoàn thiện hồ sơ cá nhân với kỹ năng và kinh nghiệm.",
                  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                  color: "from-blue-500 to-blue-400",
                },
                {
                  step: "02",
                  title: "Tìm & ứng tuyển",
                  desc: "Duyệt danh sách công việc, lọc theo khu vực & danh mục, nộp đơn nhanh chóng.",
                  icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                  color: "from-sky-500 to-sky-400",
                },
                {
                  step: "03",
                  title: "Làm việc & nhận tiền",
                  desc: "Hoàn thành công việc, nhận đánh giá tốt và xây dựng uy tín trên nền tảng.",
                  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  color: "from-emerald-500 to-emerald-400",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative bg-white rounded-2xl border border-blue-100 p-6 hover:shadow-lg hover:shadow-blue-50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}
                    >
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                    </div>
                    <span className="text-3xl font-extrabold text-blue-100">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Tham gia hàng ngàn người đang sử dụng GigWork mỗi ngày
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-blue-600 bg-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Đăng ký miễn phí
                  </Link>
                  <Link
                    href="/jobs"
                    className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
                  >
                    Xem việc làm
                  </Link>
                </>
              ) : (
                <Link
                  href="/jobs"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-blue-600 bg-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Khám phá việc làm
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
