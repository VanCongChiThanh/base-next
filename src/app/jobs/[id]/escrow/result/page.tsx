"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { paymentService } from "@/services";

function ResultContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const jobId = params.id as string;
  const isCancel = searchParams.get("cancel") === "true";
  const urlStatus = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");

  const [paymentState, setPaymentState] = useState<"SYNCING" | "PAID" | "FAILED">("SYNCING");

  useEffect(() => {
    if (isCancel || urlStatus === "CANCELLED") {
      setPaymentState("FAILED");
      return;
    }

    if (orderCode) {
      paymentService
        .syncEscrowDeposit(orderCode)
        .then((res) => {
          if (res.status === "FUNDED" || res.status === "PAID") {
            setPaymentState("PAID");
          } else {
            setPaymentState("FAILED");
          }
        })
        .catch((err) => {
          console.error("Failed to sync escrow status:", err);
          setPaymentState("FAILED");
        });
    } else {
      setPaymentState("FAILED");
    }
  }, [isCancel, urlStatus, orderCode]);

  if (paymentState === "SYNCING") {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-lg w-full mx-auto">
         <span className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
         <p className="text-slate-600 font-medium">Đang đồng bộ kết quả thanh toán ký quỹ...</p>
      </div>
    );
  }

  const isSuccess = paymentState === "PAID";

  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-lg w-full mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div
        className={`absolute top-0 left-0 w-full h-2 ${
          isSuccess ? "bg-emerald-500" : "bg-red-500"
        }`}
      />

      {isSuccess ? (
        <>
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 text-center">
            Thanh toán ký quỹ thành công!
          </h1>
          <p className="text-slate-600 text-center mb-8 text-lg">
            Tiền ký quỹ đã được ghi nhận. Người làm có thể bắt đầu công việc.
          </p>

          <div className="w-full space-y-3">
            <Link
              href={`/jobs/${jobId}`}
              className="flex justify-center items-center w-full py-3.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
            >
              Quay lại trang công việc
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 text-center">
            Thanh toán bị huỷ
          </h1>
          <p className="text-slate-600 text-center mb-8 text-lg">
            Giao dịch đã bị huỷ hoặc có lỗi xảy ra.
          </p>

          <div className="w-full space-y-3">
            <Link
              href={`/jobs/${jobId}`}
              className="flex justify-center items-center w-full py-3.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
            >
              Quay lại trang công việc
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function EscrowResultPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center">
              <span className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-600 font-medium">
                Đang xử lý kết quả...
              </p>
            </div>
          }
        >
          <ResultContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
