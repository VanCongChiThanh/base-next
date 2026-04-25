"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, section?: string) => string;
}

const translations: Record<Language, Record<string, any>> = {
  vi: {
    common: {
      login: "Đăng nhập",
      register: "Đăng ký",
      logout: "Đăng xuất",
      home: "Trang chủ",
      jobs: "Tìm việc",
      postJob: "Đăng việc",
      pricing: "Bảng giá",
      dashboard: "Dashboard",
      savedJobs: "Việc đã lưu",
      profile: "Hồ sơ",
      language: "Ngôn ngữ",
      hireNow: "Thuê ngay",
      postHireMe: "Đăng Thuê Tôi",
    },
    auth: {
      email: "Email",
      password: "Mật khẩu",
      firstName: "Tên",
      lastName: "Họ",
      registerTitle: "Đăng ký tài khoản",
      registerSub: "Bắt đầu hành trình của bạn với GigWork",
      loginTitle: "Chào mừng trở lại",
      loginSub: "Đăng nhập để quản lý công việc và tìm kiếm cơ hội",
      registerButton: "Tạo tài khoản",
      loginButton: "Đăng nhập ngay",
      forgotPassword: "Quên mật khẩu?",
      noAccount: "Chưa có tài khoản?",
      hasAccount: "Đã có tài khoản?",
    },
    services: {
      heroTitle: "Tìm người làm ngay ⚡",
      heroSubtitle: "Tìm người đang rảnh để làm việc ngay: dọn dẹp, giao hàng, phụ quán...",
      aiSearchTitle: "✨ Tìm nhanh bằng AI",
      manualFilter: "Bộ lọc",
      aiSearchPlaceholder: "Mô tả nhu cầu của bạn. VD: Tôi cần một người thợ sửa ống nước đến ngay tại Quận 1...",
      aiSearchButton: "Tìm kiếm AI",
      aiSearching: "Đang phân tích...",
      keywordPlaceholder: "Từ khóa (chụp ảnh, dọn dẹp...)",
      allCategories: "Tất cả lĩnh vực",
      allLocations: "Toàn quốc",
      availableNow: "Rảnh ngay",
      availableStatus: "Sẵn sàng làm ngay",
      datePosted: "Ngày đăng",
      viewProfile: "Xem hồ sơ",
      aboutMe: "Giới thiệu bản thân",
      price: "Mức giá",
      location: "Khu vực",
      online: "Online",
      offline: "Trực tiếp",
      noResultsTitle: "Chưa tìm thấy ứng viên phù hợp",
      noResultsAi: "AI của chúng tôi chưa tìm thấy ai khớp với mô tả của bạn. Hãy thử diễn đạt chi tiết hơn hoặc chuyển sang dùng bộ lọc.",
      noResultsManual: "Thử thay đổi cấu hình bộ lọc hoặc tìm kiếm bằng từ khoá khác để mở rộng kết quả.",
      clearFilters: "Xoá toàn bộ bộ lọc",
      aiFound: "AI đã phân tích và tìm thấy {count} ứng viên phù hợp với nhu cầu.",
    },
    admin: {
      dashboard: "Dashboard",
      users: "Người dùng",
      jobs: "Công việc",
      categories: "Danh mục",
      reports: "Báo cáo",
      disputes: "Tranh chấp",
      payments: "Thanh toán",
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language: Language = "vi";

  const setLanguage = (_lang: Language) => {
    // Multi-language removed, only Vietnamese supported
  };

  const t = (key: string, section = "common") => {
    return translations["vi"]?.[section]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
