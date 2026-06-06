'use client';

import { Users, Briefcase, DollarSign, TrendingUp, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { organizationService, DashboardStats } from '@/services/organization.service';
import { Job } from '@/types';
import { format } from 'date-fns';

export default function OrgDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      organizationService.getDashboardStats(),
      organizationService.getJobs()
    ])
      .then(([statsData, jobsData]) => {
        setStats(statsData);
        setRecentJobs(jobsData?.slice(0, 5) || []);
      })
      .catch(err => {
        console.error("Failed to load dashboard data", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const displayStats = [
    { name: 'Việc làm đang mở', value: stats?.activeJobs || 0, change: '+0', trend: 'up', icon: Briefcase },
    { name: 'Tổng ứng viên', value: stats?.totalApplicants || 0, change: '+0', trend: 'up', icon: Users },
    { name: 'Ứng viên mới', value: stats?.newApplicants || 0, change: '0', trend: 'down', icon: TrendingUp },
    { name: 'Đã chi trả', value: `${(stats?.totalSpent || 0).toLocaleString()} ₫`, change: '0', trend: 'up', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan tổ chức</h1>
        <p className="text-slate-500 mt-1">Theo dõi hoạt động tuyển dụng và quản lý tài chính của doanh nghiệp bạn.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.trend === 'up';
          return (
            <div key={stat.name} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className={`flex items-center text-sm font-medium ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.change}
                  {isUp ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
                <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Việc làm gần đây</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Xem tất cả</button>
          </div>
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vị trí</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Đăng lúc</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500">Đang tải...</td></tr>
                ) : recentJobs.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500">Chưa có việc làm nào</td></tr>
                ) : recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">{job.title}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {job.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {job.createdAt ? format(new Date(job.createdAt), 'dd/MM/yyyy') : ''}
                    </td>
                    <td className="py-4 px-6 text-sm text-right">
                      <button className="text-slate-400 hover:text-indigo-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-6 text-center py-8 text-slate-500">
            Tính năng đang phát triển...
          </div>
        </div>
      </div>
    </div>
  );
}
