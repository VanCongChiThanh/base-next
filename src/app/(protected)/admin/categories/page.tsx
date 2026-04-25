"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DataTable,
  Modal,
  SearchInput,
  SelectFilter,
  ConfirmDialog,
} from "@/components/admin";
import { categoryService } from "@/services/category.service";
import { skillService } from "@/services/skill.service";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";

const CATEGORY_TYPES = [
  { value: "job", label: "Danh mục công việc" },
  { value: "skill", label: "Danh mục kỹ năng" },
];

export default function AdminCategoriesPage() {
  const [activeType, setActiveType] = useState("job");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({ id: "", name: "", description: "", icon: "📌" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeType === "job") {
        const res = await categoryService.getAll();
        setData(Array.isArray(res) ? res : []);
      } else {
        const res = await skillService.getAll();
        setData(Array.isArray(res) ? res : []);
      }
    } catch (err) {
      showToast(getErrorMessage(err as ApiError), "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setFormState({ id: "", name: "", description: "", icon: "📌" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormState({
      id: item.id,
      name: item.name,
      description: item.description || "",
      icon: item.icon || "📌",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (activeType === "job") {
        if (formState.id) {
          await categoryService.update(formState.id, {
            name: formState.name,
            description: formState.description,
            icon: formState.icon,
          });
          showToast("Cập nhật danh mục công việc thành công", "success");
        } else {
          await categoryService.create({
            name: formState.name,
            description: formState.description,
            icon: formState.icon,
          });
          showToast("Thêm danh mục công việc thành công", "success");
        }
      } else {
        if (formState.id) {
          await skillService.update(formState.id, {
            name: formState.name,
            description: formState.description,
          });
          showToast("Cập nhật kỹ năng thành công", "success");
        } else {
          await skillService.create({
            name: formState.name,
            description: formState.description,
          });
          showToast("Thêm kỹ năng thành công", "success");
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err as ApiError), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (activeType === "job") {
        await categoryService.delete(deleteTarget.id);
        showToast("Xoá danh mục công việc thành công", "success");
      } else {
        await skillService.delete(deleteTarget.id);
        showToast("Xoá kỹ năng thành công", "success");
      }
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err as ApiError), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    {
      key: "name",
      label: "Tên",
      render: (item: any) => (
        <div className="flex items-center gap-3">
          {activeType === "job" && (
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-xl flex items-center justify-center shrink-0">
              {item.icon || "📌"}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{item.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: "Mô tả",
      render: (item: any) => (
        <span className="text-gray-500 line-clamp-2">{item.description || "Không có mô tả"}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24 text-right",
      render: (item: any) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(item);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sửa"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(item);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xoá"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="mt-1 text-sm text-gray-500">
            Xem, sửa, xoá và quản lý các loại danh mục trên hệ thống
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SelectFilter
          value={activeType}
          onChange={setActiveType}
          options={CATEGORY_TYPES}
          placeholder="Chọn loại danh mục"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm kiếm theo tên..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        rowKey={(item) => item.id}
        emptyMessage="Không tìm thấy dữ liệu"
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formState.id ? `Sửa ${activeType === "job" ? "danh mục" : "kỹ năng"}` : `Thêm mới ${activeType === "job" ? "danh mục" : "kỹ năng"}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tên *</label>
            <input
              required
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Nhập tên..."
            />
          </div>

          {activeType === "job" && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Biểu tượng (Icon / Emoji)</label>
              <input
                value={formState.icon}
                onChange={(e) => setFormState({ ...formState, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Vd: 📌"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={3}
              placeholder="Nhập mô tả..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formState.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu lại"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xoá"
        message={`Bạn có chắc muốn xoá "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xoá"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
