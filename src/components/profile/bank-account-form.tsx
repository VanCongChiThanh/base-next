"use client";

import { useState, useRef } from "react";
import { userService, uploadService } from "@/services";
import { CreateBankAccountRequest } from "@/types";

const POPULAR_BANKS = [
  "Vietcombank", "VietinBank", "BIDV", "Agribank", "Techcombank",
  "MBBank", "ACB", "VPBank", "TPBank", "OCB", "SeABank", "MSB",
  "HDBank", "SHB", "VIB", "NCB", "Nam A Bank", "Sacombank",
  "ABBANK", "LienViet PostBank",
];

const BLANK_FORM: CreateBankAccountRequest = {
  bankName: "",
  accountNumber: "",
  accountName: "",
  qrCodeUrl: "",
  isDefault: false,
};

interface BankAccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  defaultIsDefault?: boolean;
}

export function BankAccountForm({ onSuccess, onCancel, defaultIsDefault = false }: BankAccountFormProps) {
  const [form, setForm] = useState<CreateBankAccountRequest>({ ...BLANK_FORM, isDefault: defaultIsDefault });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for Image Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một file hình ảnh hợp lệ.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    setError("");
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setForm(f => ({ ...f, qrCodeUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!form.bankName || !form.accountNumber || !form.accountName) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      let finalQrCodeUrl = form.qrCodeUrl;

      // Handle Image Upload First
      if (selectedFile) {
        setUploadingImage(true);
        try {
          finalQrCodeUrl = await uploadService.uploadFile(selectedFile);
        } catch (uploadErr) {
          throw new Error("Tải ảnh QR lên thất bại, vui lòng thử lại.");
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = { ...form, qrCodeUrl: finalQrCodeUrl };
      await userService.addBankAccount(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Không thể thêm tài khoản. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-200 p-5 space-y-4">
      <h4 className="text-sm font-semibold text-blue-900">Thêm tài khoản mới</h4>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Bank name */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Tên ngân hàng <span className="text-red-400">*</span>
        </label>
        <select
          value={form.bankName}
          onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">-- Chọn ngân hàng --</option>
          {POPULAR_BANKS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Account number + name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Số tài khoản <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.accountNumber}
            onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
            placeholder="VD: 1234567890"
            className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tên chủ tài khoản <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.accountName}
            onChange={e => setForm(f => ({ ...f, accountName: e.target.value.toUpperCase() }))}
            placeholder="VD: NGUYEN VAN A"
            className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* QR Code Image Upload */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Ảnh mã QR <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
        </label>
        
        {!previewUrl ? (
          <div className="flex justify-center px-6 py-6 border-2 border-blue-200 border-dashed rounded-xl bg-white hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <svg className="mx-auto h-10 w-10 text-gray-300" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4 flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Tải ảnh lên</span>
                  <input ref={fileInputRef} type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        ) : (
          <div className="relative mt-2 flex justify-center p-2 border border-blue-100 bg-white rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="QR Preview" className="h-40 w-auto object-contain rounded-lg" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1.5 hover:bg-red-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Default Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={form.isDefault || false}
          onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
          className="w-4 h-4 rounded accent-blue-600"
        />
        <span className="text-xs text-gray-700 group-hover:text-blue-700 transition-colors">
          Đặt làm tài khoản mặc định
        </span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || uploadingImage}
          className="flex-1 flex justify-center items-center py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {uploadingImage ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang tải ảnh...
            </span>
          ) : saving ? (
            "Đang lưu..."
          ) : (
            "Lưu tài khoản"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving || uploadingImage}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}
