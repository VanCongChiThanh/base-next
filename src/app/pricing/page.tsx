"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { useAuth, useEntitlements } from "@/contexts";
import { subscriptionService } from "@/services";
import { PublicPlan } from "@/types";

type ScopeTab = "EMPLOYER" | "ORGANIZATION";

const SCOPE_TABS: { key: ScopeTab; label: string; description: string }[] = [
  {
    key: "EMPLOYER",
    label: "Cá nhân",
    description: "Dành cho nhà tuyển dụng cá nhân và freelancer",
  },
  {
    key: "ORGANIZATION",
    label: "Tổ chức",
    description: "Dành cho doanh nghiệp và tổ chức tuyển dụng",
  },
];

const HIGHLIGHT_FEATURES = [
  "job.post.max_open_jobs",
  "job.apply.daily_limit",
  "ai.cv_screening.enabled",
  "ai.cv_screening.monthly_quota",
  "ai.interview_summary.enabled",
] as const;

const FEATURE_LABELS: Record<string, string> = {
  "job.post.max_open_jobs": "Số tin tuyển dụng đồng thời",
  "job.apply.daily_limit": "Giới hạn ứng tuyển / ngày",
  "ai.cv_screening.enabled": "Sàng lọc CV bằng AI",
  "ai.cv_screening.monthly_quota": "Hạn mức AI sàng lọc / tháng",
  "ai.interview_summary.enabled": "Tóm tắt phỏng vấn AI",
};

const FEATURE_ICONS: Record<string, string> = {
  "job.post.max_open_jobs": "📋",
  "job.apply.daily_limit": "🎯",
  "ai.cv_screening.enabled": "🤖",
  "ai.cv_screening.monthly_quota": "📊",
  "ai.interview_summary.enabled": "📝",
};

const PLAN_VIETNAMESE_NAMES: Record<string, string> = {
  Free: "Miễn phí",
  Starter: "Khởi đầu",
  Growth: "Tăng trưởng",
  Pro: "Chuyên nghiệp",
  "Business Lite": "Doanh nghiệp cơ bản",
  Business: "Doanh nghiệp",
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  Free: "Bắt đầu miễn phí, phù hợp cho cá nhân mới sử dụng",
  Starter: "Phù hợp cho cá nhân bắt đầu tuyển dụng thường xuyên",
  Growth: "Mở rộng quy mô tuyển dụng với công cụ AI hỗ trợ",
  Pro: "Giải pháp toàn diện cho nhà tuyển dụng chuyên nghiệp",
  "Business Lite": "Giải pháp tiết kiệm cho doanh nghiệp vừa và nhỏ",
  Business: "Giải pháp không giới hạn cho doanh nghiệp lớn",
};

const POPULAR_PLANS = ["GROWTH", "BUSINESS_LITE"];

function formatVnd(price: number): string {
  if (!price) return "0đ";
  return price.toLocaleString("vi-VN") + "đ";
}

function renderFeatureValue(
  value: boolean | number | string | null | undefined,
) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Có
      </span>
    ) : (
      <span className="text-slate-400">Không</span>
    );
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">—</span>;
  }

  if (typeof value === "number" && value >= 9999) {
    return (
      <span className="text-emerald-600 font-semibold">Không giới hạn</span>
    );
  }

  return <span className="font-semibold text-slate-800">{String(value)}</span>;
}

function getPlanRenderKey(plan: PublicPlan, index: number): string {
  const normalizedCode = typeof plan.code === "string" ? plan.code.trim() : "";
  return normalizedCode || `plan-${plan.scope}-${index}`;
}

export default function PricingPage() {
  const { isAuthenticated, user } = useAuth();
  const { entitlements, isLoading: entitlementLoading } = useEntitlements();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState<ScopeTab>("EMPLOYER");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleUpgrade = async (planCode: string) => {
    if (checkoutLoading) return;
    try {
      setCheckoutLoading(planCode);
      const res = await subscriptionService.createCheckout(planCode);
      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (error) {
      console.error("Lỗi khi tạo thanh toán:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      setCheckoutLoading(null);
    }
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const planData =
          await subscriptionService.getPublicPlans(activeScope);

        if (!active) return;
        setPlans(planData);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [activeScope, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      setActiveScope(user.role === "ORGANIZATION" ? "ORGANIZATION" : "EMPLOYER");
    }
  }, [isAuthenticated, user?.role]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.price - b.price),
    [plans],
  );

  const activeScopeData = SCOPE_TABS.find((t) => t.key === activeScope);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Hero Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight">
              Bảng giá dịch vụ
            </h1>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Chọn gói phù hợp với nhu cầu tuyển dụng. Nâng cấp hoặc hạ gói bất
              kỳ lúc nào.
            </p>

            {entitlements?.plan && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-white">
                  Gói hiện tại:{" "}
                  <strong>
                    {PLAN_VIETNAMESE_NAMES[entitlements.plan.name] ??
                      entitlements.plan.name}
                  </strong>
                </span>
              </div>
            )}

            {/* Scope Tabs */}
            {!isAuthenticated ? (
              <div className="mt-8 flex justify-center">
                <div className="inline-flex rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-1.5 shadow-xl">
                  {SCOPE_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveScope(tab.key)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        activeScope === tab.key
                          ? "bg-white text-indigo-700 shadow-md transform scale-105"
                          : "text-white/80 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2.5 text-sm font-bold text-white shadow-lg">
                  <span className="text-lg">{user?.role === "ORGANIZATION" ? "🏢" : "👤"}</span>
                  Gói dịch vụ dành cho {user?.role === "ORGANIZATION" ? "Tổ chức" : "Cá nhân"}
                </span>
              </div>
            )}

            {activeScopeData && (
              <p className="mt-3 text-sm text-blue-200">
                {activeScopeData.description}
              </p>
            )}
          </div>
        </section>

        {/* Plans Grid */}
        <section className="mx-auto max-w-6xl px-4 -mt-8 sm:px-6 lg:px-8 pb-16">
          {loading || (isAuthenticated && entitlementLoading) ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: activeScope === "EMPLOYER" ? 4 : 2 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg animate-pulse"
                  >
                    <div className="h-6 w-24 bg-slate-200 rounded-lg mb-3" />
                    <div className="h-10 w-32 bg-slate-200 rounded-lg mb-4" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div
                          key={j}
                          className="h-4 bg-slate-100 rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-6 ${
                sortedPlans.length <= 2
                  ? "md:grid-cols-2 max-w-3xl mx-auto"
                  : sortedPlans.length === 3
                    ? "md:grid-cols-3 max-w-5xl mx-auto"
                    : "md:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {sortedPlans.map((plan, index) => {
                const isCurrent = entitlements?.plan?.code === plan.code;
                const isPopular = POPULAR_PLANS.includes(plan.code);
                const renderKey = getPlanRenderKey(plan, index);
                const viName =
                  PLAN_VIETNAMESE_NAMES[plan.name] ?? plan.name;
                const description =
                  PLAN_DESCRIPTIONS[plan.name] ?? "";

                return (
                  <article
                    key={renderKey}
                    className={`relative rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                      isCurrent
                        ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-200"
                        : isPopular
                          ? "border-indigo-400 bg-gradient-to-b from-indigo-50/50 to-white"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Badges */}
                    {isPopular && !isCurrent && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                          ⭐ Phổ biến nhất
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                          ✓ Gói hiện tại
                        </span>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className={`${isPopular || isCurrent ? "pt-3" : ""}`}>
                      <h2
                        className={`text-xl font-bold ${
                          isPopular
                            ? "text-indigo-900"
                            : "text-slate-900"
                        }`}
                      >
                        {viName}
                      </h2>
                      {description && (
                        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                          {description}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mt-5 mb-6">
                      {plan.price === 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-slate-900">
                            Miễn phí
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-4xl font-extrabold ${
                              isPopular
                                ? "text-indigo-700"
                                : "text-slate-900"
                            }`}
                          >
                            {formatVnd(Number(plan.price))}
                          </span>
                          <span className="text-sm text-slate-500">/tháng</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div
                      className={`border-t ${
                        isPopular
                          ? "border-indigo-200"
                          : "border-slate-200"
                      } mb-5`}
                    />

                    {/* Plan Stats */}
                    <div className="space-y-2.5 mb-5 text-sm">
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          📝
                        </span>
                        <span>
                          Đăng tối đa{" "}
                          <strong>{plan.maxPostsPerMonth}</strong> tin / tháng
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
                          ⏳
                        </span>
                        <span>
                          Tin hiển thị{" "}
                          <strong>{plan.postExpiryDays}</strong> ngày
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                          ⭐
                        </span>
                        <span>
                          <strong>{plan.featuredPosts}</strong> tin nổi bật
                        </span>
                      </div>
                    </div>

                    {/* Feature List */}
                    <ul className="space-y-3 text-sm flex-1">
                      {HIGHLIGHT_FEATURES.map((key) => (
                        <li
                          key={key}
                          className="flex items-start justify-between gap-3"
                        >
                          <span className="flex items-center gap-2 text-slate-600">
                            <span className="text-base">
                              {FEATURE_ICONS[key] ?? "●"}
                            </span>
                            {FEATURE_LABELS[key]}
                          </span>
                          <span className="text-right whitespace-nowrap">
                            {renderFeatureValue(plan.featureConfig[key])}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      {isCurrent ? (
                        <div className="w-full text-center py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl">
                          Đang sử dụng
                        </div>
                      ) : isAuthenticated ? (
                        plan.price === 0 ? (
                          <div className="w-full text-center py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 rounded-xl">
                            Gói cơ bản mặc định
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpgrade(plan.code)}
                            disabled={checkoutLoading !== null}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex justify-center items-center gap-2 ${
                              checkoutLoading === plan.code ? "opacity-75 cursor-not-allowed" : ""
                            } ${
                              isPopular
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-violet-700"
                                : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                            }`}
                          >
                            {checkoutLoading === plan.code ? (
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              "Nâng cấp gói này"
                            )}
                          </button>
                        )
                      ) : (
                        <Link
                          href="/login"
                          className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            isPopular
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          Đăng nhập để sử dụng
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
