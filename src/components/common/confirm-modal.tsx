"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "success" | "warning";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ bỏ",
  variant = "primary",
  isLoading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    danger: "bg-red-600 hover:bg-red-700 shadow-red-200",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
  };

  const iconColors = {
    primary: "text-blue-600 bg-blue-50",
    danger: "text-red-600 bg-red-50",
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", iconColors[variant])}>
              {variant === "danger" ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : variant === "success" ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-gray-500 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg disabled:opacity-50",
              variantStyles[variant]
            )}
          >
            {isLoading ? "Đang xử lý..." : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
