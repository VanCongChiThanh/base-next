"use client";

import { useState } from "react";
import { AuthGuard } from "@/components";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EkycWidget } from "@/components/common/ekyc-widget";
import { VnptEkycResult } from "@/types";

function EkycPageContent() {
  const [result, setResult] = useState<VnptEkycResult | null>(null);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Xác thực eKYC</h1>
          <p className="mt-2 text-sm text-slate-600">
            Xác thực nhanh giấy tờ và khuôn mặt để tăng độ tin cậy tài khoản.
            Nếu mạng không ổn định, bạn có thể thử lại ngay trong widget.
          </p>
        </div>

        <EkycWidget
          onResult={(payload) => {
            setResult(payload);
          }}
        />

        {result && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-sm text-slate-100">
            <h2 className="mb-3 text-base font-semibold">Kết quả callback</h2>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words">
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function EkycPage() {
  return (
    <AuthGuard>
      <EkycPageContent />
    </AuthGuard>
  );
}
