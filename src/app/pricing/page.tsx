"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { useAuth, useEntitlements } from "@/contexts";
import { subscriptionService } from "@/services";
import { PublicPlan } from "@/types";

const HIGHLIGHT_FEATURES = [
  "job.post.max_open_jobs",
  "job.apply.daily_limit",
  "ai.cv_screening.enabled",
  "ai.cv_screening.monthly_quota",
  "ai.interview_summary.enabled",
] as const;

const FEATURE_LABELS: Record<string, string> = {
  "job.post.max_open_jobs": "Số job mở đồng thời",
  "job.apply.daily_limit": "Giới hạn apply/ngày",
  "ai.cv_screening.enabled": "AI lọc CV",
  "ai.cv_screening.monthly_quota": "Quota AI lọc CV/tháng",
  "ai.interview_summary.enabled": "AI tóm tắt phỏng vấn",
};

function formatVnd(price: number): string {
  if (!price) return "Miễn phí";
  return `${price.toLocaleString("vi-VN")}đ/tháng`;
}

function renderFeatureValue(
  value: boolean | number | string | null | undefined,
) {
  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const { entitlements, isLoading: entitlementLoading } = useEntitlements();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const planData = await subscriptionService.getPublicPlans();

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
  }, [isAuthenticated]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.price - b.price),
    [plans],
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Bang gia</h1>
          <p className="mt-2 text-sm text-slate-600">
            Mo hinh gia linh hoat cho viec lam ngan han. Them tinh nang AI sau
            nay khong can sua code, chi can cap nhat entitlement.
          </p>
          {entitlements && (
            <p className="mt-3 text-sm text-sky-700">
              Goi hien tai cua ban:{" "}
              <strong>{entitlements.plan?.name ?? "Free"}</strong>
            </p>
          )}
        </section>

        {loading || (isAuthenticated && entitlementLoading) ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Dang tai bang gia...
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {sortedPlans.map((plan) => {
              const isCurrent = entitlements?.plan?.code === plan.code;

              return (
                <article
                  key={plan.code}
                  className={`rounded-2xl border p-5 shadow-sm ${
                    isCurrent
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {plan.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatVnd(Number(plan.price))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Scope: {plan.scope}
                  </p>

                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {HIGHLIGHT_FEATURES.map((key) => (
                      <li
                        key={key}
                        className="flex items-start justify-between gap-3"
                      >
                        <span>{FEATURE_LABELS[key]}</span>
                        <span className="font-medium">
                          {renderFeatureValue(plan.featureConfig[key])}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    {isAuthenticated ? (
                      <p className="text-xs text-slate-500">
                        Nang cap goi duoc xu ly boi admin (flow hien tai).
                      </p>
                    ) : (
                      <Link
                        href="/login"
                        className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Dang nhap de su dung
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
