import apiClient from "@/lib/api-client";
import { JobCategory } from "@/types";

export const categoryService = {
  async getAll(): Promise<JobCategory[]> {
    return apiClient.get<JobCategory[]>("/job-categories");
  },
};
