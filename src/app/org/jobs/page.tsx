'use client';

import { Search, Plus, Filter, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { organizationService } from '@/services/organization.service';
import { Job } from '@/types';
import { format } from 'date-fns';

export default function OrgJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizationService.getJobs()
      .then(data => {
        setJobs(data || []);
      })
      .catch(err => {
        console.error("Failed to load org jobs", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý việc làm</h1>
          <p className="text-slate-500 mt-1">Quản lý các tin tuyển dụng và theo dõi ứng viên.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Đăng việc mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm việc làm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên công việc</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ứng viên cần</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày đăng</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Chưa có việc làm nào.</td>
                </tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-indigo-600">{job.title}</span>
                      <span className="text-xs text-slate-500">{job.category?.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {job.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700">{job.requiredWorkers}</td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {job.createdAt ? format(new Date(job.createdAt), 'dd/MM/yyyy') : ''}
                  </td>
                  <td className="py-4 px-6 text-sm text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors" title="Chỉnh sửa">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-slate-400 hover:text-rose-600 transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-500">Hiển thị <span className="font-medium text-slate-900">{jobs.length > 0 ? 1 : 0}</span> đến <span className="font-medium text-slate-900">{jobs.length}</span> trong <span className="font-medium text-slate-900">{jobs.length}</span> kết quả</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-slate-300 rounded disabled:opacity-50" disabled>Trang trước</button>
            <button className="px-3 py-1 text-sm border border-slate-300 rounded disabled:opacity-50" disabled>Trang sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
