'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  CreditCard, 
  Settings,
  LogOut,
  Building2,
  Home
} from 'lucide-react';

const navItems = [
  { name: 'Tổng quan', href: '/org/dashboard', icon: LayoutDashboard },
  { name: 'Quản lý việc làm', href: '/org/jobs', icon: Briefcase },
  { name: 'Quản lý Nhân viên', href: '/org/staff', icon: Users },
  { name: 'Tài chính & Thanh toán', href: '/org/finance', icon: CreditCard },
  { name: 'Hồ sơ công ty', href: '/org/profile', icon: Building2 },
];

export function OrgSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white border-r border-slate-800">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <Building2 className="w-6 h-6 mr-3 text-indigo-400" />
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Org Portal
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <Home className="w-5 h-5 mr-3 text-slate-500" />
          Trang chủ
        </Link>
        <Link
          href="/org/settings"
          className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <Settings className="w-5 h-5 mr-3 text-slate-500" />
          Cài đặt
        </Link>
        <button
          className="flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-rose-500" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
