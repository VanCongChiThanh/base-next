"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DataTable,
  Pagination,
  Badge,
  SearchInput,
  SelectFilter,
  ConfirmDialog,
  Avatar,
} from "@/components/admin";
import { adminService } from "@/services";
import { User, Role, ApiError } from "@/types";
import { getErrorMessage } from "@/lib/api-client";

const ROLE_OPTIONS = [
  { value: Role.USER, label: "User" },
  { value: Role.ADMIN, label: "Admin" },
];

const VERIFIED_OPTIONS = [
  { value: "true", label: "Verified" },
  { value: "false", label: "Not verified" },
];

export default function AdminUsersPage() {
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Action state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<User | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const limit = 10;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        limit,
        search: search || undefined,
        role: roleFilter || undefined,
        isEmailVerified: verifiedFilter || undefined,
        sortBy,
        sortOrder,
      });
      setUsers(res.users);
      setTotal(res.pagination.total);
    } catch (err) {
      showToast(getErrorMessage(err as ApiError), "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, verifiedFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, verifiedFilter]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(key);
      setSortOrder("ASC");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminService.deleteUser(deleteTarget.id);
      showToast("User deleted successfully", "success");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      showToast(getErrorMessage(err as ApiError), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;
    setIsChangingRole(true);
    const newRole =
      roleChangeTarget.role === Role.ADMIN ? Role.USER : Role.ADMIN;
    try {
      await adminService.updateUserRole(roleChangeTarget.id, newRole);
      showToast(`Role updated to ${newRole}`, "success");
      setRoleChangeTarget(null);
      fetchUsers();
    } catch (err) {
      showToast(getErrorMessage(err as ApiError), "error");
    } finally {
      setIsChangingRole(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const columns = [
    {
      key: "user",
      label: "User",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatarUrl}
            firstName={user.firstName}
            lastName={user.lastName}
            size="sm"
          />
          <div>
            <p className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user: User) => (
        <Badge variant={user.role === Role.ADMIN ? "purple" : "info"}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: "isEmailVerified",
      label: "Status",
      render: (user: User) => (
        <Badge variant={user.isEmailVerified ? "success" : "warning"}>
          {user.isEmailVerified ? "Verified" : "Unverified"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user: User) => (
        <span className="text-gray-500">
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24 text-right",
      render: (user: User) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRoleChangeTarget(user);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Change role"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(user);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete user"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage user accounts and permissions ·{" "}
          <span className="font-medium text-gray-700">{total}</span> total users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
          className="flex-1 max-w-md"
        />
        <SelectFilter
          value={roleFilter}
          onChange={setRoleFilter}
          options={ROLE_OPTIONS}
          placeholder="All roles"
        />
        <SelectFilter
          value={verifiedFilter}
          onChange={setVerifiedFilter}
          options={VERIFIED_OPTIONS}
          placeholder="All status"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        rowKey={(user) => user.id}
        emptyMessage="No users found"
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {users.length ? (page - 1) * limit + 1 : 0}–
          {Math.min(page * limit, total)} of {total}
        </p>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Role Change Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        onConfirm={handleRoleChange}
        title="Change Role"
        message={`Change "${roleChangeTarget?.firstName} ${roleChangeTarget?.lastName}" role from ${roleChangeTarget?.role} to ${roleChangeTarget?.role === Role.ADMIN ? Role.USER : Role.ADMIN}?`}
        confirmText="Confirm"
        variant="warning"
        isLoading={isChangingRole}
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
