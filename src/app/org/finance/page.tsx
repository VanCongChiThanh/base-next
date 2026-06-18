'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Download,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  organizationService,
  FinanceStats,
  Transaction,
} from '@/services/organization.service';
import { LoadingState, ErrorState } from '@/components/common';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Escrow statuses
  PENDING: { label: 'Chờ xử lý', className: 'bg-amber-100 text-amber-800' },
  FUNDED: { label: 'Đã ký quỹ', className: 'bg-blue-100 text-blue-800' },
  PARTIALLY_RELEASED: { label: 'Giải ngân 1 phần', className: 'bg-indigo-100 text-indigo-800' },
  FULLY_RELEASED: { label: 'Đã hoàn tất', className: 'bg-emerald-100 text-emerald-800' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', className: 'bg-orange-100 text-orange-800' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-rose-100 text-rose-800' },
  DISPUTED: { label: 'Tranh chấp', className: 'bg-red-100 text-red-800' },
  // Payment statuses
  PAYMENT_CONFIRMED: { label: 'Đã thanh toán', className: 'bg-emerald-100 text-emerald-800' },
  ESCROW_HELD: { label: 'Đang giữ', className: 'bg-blue-100 text-blue-800' },
  ESCROW_RELEASED: { label: 'Đã giải ngân', className: 'bg-emerald-100 text-emerald-800' },
  ESCROW_REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-rose-100 text-rose-800' },
};

const TYPE_MAP: Record<string, string> = {
  Escrow: 'Ký quỹ',
  FINAL_PAYMENT: 'Thanh toán cuối',
  ESCROW_DEPOSIT: 'Ký quỹ Escrow',
  MILESTONE_RELEASE: 'Giải ngân milestone',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('vi-VN') + ' ₫';
}

export default function OrgFinancePage() {
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      organizationService.getFinanceStats(),
      organizationService.getTransactions(),
    ])
      .then(([statsData, txData]) => {
        setFinanceStats(statsData);
        setTransactions(txData);
      })
      .catch((err) => {
        console.error('Failed to load finance data', err);
        setError('Không thể tải dữ liệu tài chính. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingState message="Đang tải dữ liệu tài chính..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tài chính & Doanh thu</h1>
          <p className="text-slate-500 mt-1">
            Quản lý dòng tiền, ngân sách trả lương và chi phí đăng tin.
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
          <Download className="w-4 h-4 mr-2" />
          Xuất báo cáo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-indigo-100 font-medium">Số dư ví doanh nghiệp</span>
              <Wallet className="w-6 h-6 text-indigo-200" />
            </div>
            <h2 className="text-3xl font-bold mb-1">
              {formatCurrency(financeStats?.balance ?? 0)}
            </h2>
            <div className="flex items-center mt-4 pt-4 border-t border-indigo-500/30">
              <TrendingUp className="w-4 h-4 mr-1 text-emerald-300" />
              <span className="text-sm text-indigo-100">
                Tổng chi <span className="font-semibold text-white">{formatCurrency(financeStats?.totalSpent ?? 0)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Tổng chi trả</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {formatCurrency(financeStats?.totalSpent ?? 0)}
          </h2>
          <div className="text-xs text-slate-500 space-y-0.5">
            <div className="flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Escrow: {formatCurrency(financeStats?.totalEscrowSpent ?? 0)}
            </div>
            <div className="flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Thanh toán: {formatCurrency(financeStats?.totalPaymentSpent ?? 0)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Chi phí gói & Đăng tin</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {formatCurrency(financeStats?.monthlySubscription ?? 0)}
          </h2>
          <div className="flex items-center text-sm font-medium text-emerald-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            Đang sử dụng gói Premium
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mã GD
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    Chưa có giao dịch nào.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isIncome = tx.amount > 0;
                  const statusInfo = STATUS_MAP[tx.status] ?? {
                    label: tx.status,
                    className: 'bg-slate-100 text-slate-800',
                  };

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                        {tx.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">{tx.date}</td>
                      <td className="py-4 px-6 text-sm text-slate-900">{tx.description}</td>
                      <td className="py-4 px-6 text-sm text-slate-500">{TYPE_MAP[tx.type] ?? tx.type}</td>
                      <td className="py-4 px-6 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-6 text-sm font-medium text-right ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}