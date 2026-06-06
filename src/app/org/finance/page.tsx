'use client';

import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Download,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const transactions = [
  {
    id: 'TXN-001',
    date: '2026-06-05',
    description: 'Thanh toán Escrow - Vị trí UI/UX',
    amount: '-15,000,000 ₫',
    status: 'Completed',
    type: 'Escrow',
  },
  {
    id: 'TXN-002',
    date: '2026-06-03',
    description: 'Nạp tiền ví doanh nghiệp',
    amount: '+50,000,000 ₫',
    status: 'Completed',
    type: 'Topup',
  },
  {
    id: 'TXN-003',
    date: '2026-06-01',
    description: 'Gia hạn gói Doanh Nghiệp Premium',
    amount: '-2,500,000 ₫',
    status: 'Completed',
    type: 'Subscription',
  },
  {
    id: 'TXN-004',
    date: '2026-05-28',
    description: 'Thanh toán Escrow - Vị trí Marketing',
    amount: '-8,000,000 ₫',
    status: 'Completed',
    type: 'Escrow',
  },
];

export default function OrgFinancePage() {
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
            <h2 className="text-3xl font-bold mb-1">125,500,000 ₫</h2>
            <div className="flex items-center mt-4 pt-4 border-t border-indigo-500/30">
              <TrendingUp className="w-4 h-4 mr-1 text-emerald-300" />
              <span className="text-sm text-indigo-100">
                Đã nạp <span className="font-semibold text-white">50M ₫</span> tháng này
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Tổng chi trả (Tháng này)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">24,500,000 ₫</h2>
          <div className="flex items-center text-sm font-medium text-rose-600">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            +12% <span className="text-slate-500 font-normal ml-1">so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Chi phí gói & Đăng tin</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">2,500,000 ₫</h2>
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
              {transactions.map((tx) => {
                const isIncome = tx.amount.startsWith('+');

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-500 font-medium">{tx.id}</td>
                    <td className="py-4 px-6 text-sm text-slate-500">{tx.date}</td>
                    <td className="py-4 px-6 text-sm text-slate-900">{tx.description}</td>
                    <td className="py-4 px-6 text-sm text-slate-500">{tx.type}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className={`py-4 px-6 text-sm font-medium text-right ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.amount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}