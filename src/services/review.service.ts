import apiClient from "@/lib/api-client";
import { Review, CreateReviewRequest } from "@/types";

export const reviewService = {
  async create(data: CreateReviewRequest): Promise<Review> {
    return apiClient.post<Review>("/reviews", data);
  },

  async getByJob(jobId: string, page = 1, limit = 10) {
    return apiClient.get<{ data: Review[], total: number }>(`/reviews/job/${jobId}?page=${page}&limit=${limit}`);
  },

  async getByUser(userId: string, page = 1, limit = 10) {
    return apiClient.get<{ data: Review[], total: number }>(`/reviews/user/${userId}?page=${page}&limit=${limit}`);
  },
};
