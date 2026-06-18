'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Đã xảy ra lỗi khi tải dữ liệu.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-rose-500" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
      )}
    </div>
  );
}
