import apiClient from "@/lib/api-client";
import { User, ApiSuccessResponse, PaginationMeta, Job, PaymentConfirmation, Dispute } from "@/types";
import { Role } from "@/types/enums";

export interface AdminGetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isEmailVerified?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface AdminUsersResult {
  users: User[];
  pagination: PaginationMeta;
}

export interface DashboardOverview {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  totalCompletedJobs: number;
  totalReviews: number;
  openDisputes: number;
  pendingReports: number;
}

export interface DashboardStats {
  overview: DashboardOverview;
  jobsByStatus: { status: string; count: number }[];
  recentJobs: Job[];
  recentUsers: User[];
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  jobId: string | null;
  reason: string;
  description: string;
  status: string;
  adminNote: string | null;
  reporter: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  reportedUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  job: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export const adminService = {
  // ==================== USERS ====================
  async getUsers(params: AdminGetUsersParams = {}): Promise<AdminUsersResult> {
    const query = buildQuery({ ...params });
    const res: ApiSuccessResponse<User[]> = await apiClient.requestFull<User[]>(
      `/users${query}`,
    );
    return {
      users: res.data ?? [],
      pagination: res.meta?.pagination ?? {
        page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false,
      },
    };
  },

  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async updateUserRole(id: string, role: Role): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/role`, { role });
  },

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },

  // ==================== DASHBOARD STATS ====================
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>("/admin/stats");
  },

  // ==================== ADMIN JOBS ====================
  async getJobs(params: { page?: number; limit?: number; status?: string; search?: string } = {}): Promise<PaginatedResult<Job>> {
    const query = buildQuery(params);
    return apiClient.get<PaginatedResult<Job>>(`/admin/jobs${query}`);
  },

  async closeJob(id: string): Promise<Job> {
    return apiClient.post<Job>(`/admin/jobs/${id}/close`);
  },

  async deleteJob(id: string): Promise<void> {
    return apiClient.delete(`/admin/jobs/${id}`);
  },

  // ==================== ADMIN PAYMENTS ====================
  async getPayments(params: { page?: number; limit?: number; status?: string } = {}): Promise<PaginatedResult<PaymentConfirmation>> {
    const query = buildQuery(params);
    return apiClient.get<PaginatedResult<PaymentConfirmation>>(`/admin/payments${query}`);
  },

  // ==================== ADMIN REPORTS ====================
  async getReports(params: { page?: number; limit?: number; status?: string } = {}): Promise<PaginatedResult<Report>> {
    const query = buildQuery(params);
    return apiClient.get<PaginatedResult<Report>>(`/reports${query}`);
  },

  async updateReport(id: string, data: { status: string; adminNote?: string }): Promise<Report> {
    return apiClient.patch<Report>(`/reports/${id}`, data);
  },

  // ==================== ADMIN DISPUTES ====================
  async getDisputes(params: { page?: number; limit?: number; status?: string } = {}): Promise<PaginatedResult<Dispute>> {
    const query = buildQuery(params);
    return apiClient.get<PaginatedResult<Dispute>>(`/admin/disputes${query}`);
  },

  async resolveDispute(id: string, resolution: string): Promise<Dispute> {
    return apiClient.post<Dispute>(`/admin/disputes/${id}/resolve`, { resolution });
  },

  async dismissDispute(id: string, resolution: string): Promise<Dispute> {
    return apiClient.post<Dispute>(`/admin/disputes/${id}/dismiss`, { resolution });
  },
};

export default adminService;
