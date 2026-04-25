import { apiClient } from "@/lib/api-client";
import { JobCategory } from "@/types";

export const categoryService = {
  async getAll(): Promise<JobCategory[]> {
    return apiClient.get<JobCategory[]>("/job-categories");
  },
  async create(data: { name: string; description?: string; icon?: string }): Promise<JobCategory> {
    return apiClient.post<JobCategory>("/job-categories", data);
  },
  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/job-categories/${id}`);
  },
  async update(id: string, data: { name?: string; description?: string; icon?: string }): Promise<JobCategory> {
    return apiClient.patch<JobCategory>(`/job-categories/${id}`, data);
  }
};
