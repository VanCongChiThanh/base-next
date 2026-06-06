'use client';

import { Bell, Search, Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts';
import { Role } from '@/types';

export function OrgHeader() {
  const { user } = useAuth();
  
  // Format display name based on role
  const displayName = user?.role === Role.ORGANIZATION 
    ? (user?.lastName || user?.firstName || 'Tổ chức') 
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Người dùng';
    
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm z-10">
      <div className="flex items-center flex-1">
        <button className="lg:hidden text-slate-500 hover:text-slate-700 mr-4">
          <Menu className="w-6 h-6" />
        </button>
        <div className="max-w-md w-full hidden md:block relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm công việc, nhân viên..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200"></div>
        
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">{displayName}</p>
            <p className="text-xs text-slate-500">{user?.email || ''}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
