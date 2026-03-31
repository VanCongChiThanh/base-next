import apiClient from "@/lib/api-client";
import { User, ApiSuccessResponse, PaginationMeta } from "@/types";
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

export const adminService = {
  /**
   * Get all users (paginated, with filters)
   * Backend interceptor transforms { data, total, page, limit } ->
   * { success, data: User[], meta: { pagination } }
   */
  async getUsers(params: AdminGetUsersParams = {}): Promise<AdminUsersResult> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);
    if (params.isEmailVerified)
      searchParams.set("isEmailVerified", params.isEmailVerified);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    const res: ApiSuccessResponse<User[]> = await apiClient.requestFull<User[]>(
      `/users${query ? `?${query}` : ""}`,
    );

    return {
      users: res.data ?? [],
      pagination: res.meta?.pagination ?? {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: Role): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/role`, { role });
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },
};

export default adminService;
