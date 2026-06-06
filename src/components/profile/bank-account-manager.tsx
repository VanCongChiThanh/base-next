"use client";

import { useState, useEffect, useCallback } from "react";
import { userService } from "@/services";
import { BankAccount } from "@/types";
import { BankAccountForm } from "./bank-account-form";

// ─── Local helpers ───────────────────────────────────────────────────────────

const BankIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 10h18M3 10V6a1 1 0 011-1h16a1 1 0 011 1v4M3 10l1 10h16l1-10" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a1 1 0 011-1h6a1 1 0 011 1v2" />
  </svg>
);

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
    viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export function BankAccountManager() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getBankAccounts();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);



  const handleSetDefault = async (id: string) => {
    setSaving(true);
    try {
      await userService.updateBankAccount(id, { isDefault: true });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await userService.deleteBankAccount(id);
      await load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <BankIcon />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Tài khoản ngân hàng</h3>
            <p className="text-xs text-gray-500">Dùng để nhận thanh toán từ nhà tuyển dụng</p>
          </div>
        </div>
        {!showForm && accounts.length < 5 && (
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
          >
            <PlusIcon />
            Thêm tài khoản
          </button>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">{success}</p>
      )}

      {/* Add Form */}
      {showForm && (
        <BankAccountForm 
          onSuccess={() => {
            setShowForm(false);
            setSuccess("Đã thêm tài khoản!");
            load();
          }}
          onCancel={() => {
            setShowForm(false);
            setError("");
          }}
        />
      )}

      {/* Account List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="text-3xl mb-2">🏦</div>
          <p className="text-sm text-gray-500 font-medium">Chưa có tài khoản ngân hàng</p>
          <p className="text-xs text-gray-400 mt-1">Thêm tài khoản để nhận thanh toán P2P</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                acc.isDefault
                  ? "border-blue-300 bg-blue-50/60"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* QR or bank icon */}
              <div className="shrink-0 w-14 h-14 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                {acc.qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={acc.qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl">🏦</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">{acc.bankName}</span>
                  {acc.isDefault && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      <StarIcon filled /> Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 font-mono mt-0.5">{acc.accountNumber}</p>
                <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">{acc.accountName}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {!acc.isDefault && (
                  <button
                    onClick={() => handleSetDefault(acc.id)}
                    disabled={!!saving}
                    title="Đặt làm mặc định"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-40"
                  >
                    <StarIcon />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(acc.id)}
                  disabled={deleting === acc.id}
                  title="Xoá tài khoản"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  {deleting === acc.id
                    ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <TrashIcon />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accounts.length >= 5 && (
        <p className="text-xs text-gray-400 text-center">Tối đa 5 tài khoản ngân hàng</p>
      )}
    </div>
  );
}
