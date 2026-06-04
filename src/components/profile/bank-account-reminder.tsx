"use client";

import { useState, useEffect } from "react";
import { userService } from "@/services";
import { BankAccountForm } from "./bank-account-form";

export function BankAccountReminder() {
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccounts = async () => {
      try {
        const accounts = await userService.getBankAccounts();
        setHasAccount(accounts.length > 0);
      } catch (err) {
        console.error("Failed to fetch bank accounts", err);
      } finally {
        setLoading(false);
      }
    };
    checkAccounts();
  }, []);

  if (loading || hasAccount === null || hasAccount) return null;

  return (
    <>
      <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Cập nhật tài khoản ngân hàng</h3>
            <p className="text-xs text-amber-700 mt-1">
              Bạn chưa liên kết tài khoản ngân hàng. Vui lòng thêm tài khoản để có thể nhận thanh toán từ các công việc đã hoàn thành.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 whitespace-nowrap bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Thêm ngay
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Liên kết tài khoản ngân hàng</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <BankAccountForm
                defaultIsDefault={true}
                onSuccess={() => {
                  setShowModal(false);
                  setHasAccount(true); // Hide banner on success
                }}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
