import apiClient from "@/lib/api-client";
import { Review, CreateReviewRequest } from "@/types";

export const reviewService = {
  async create(data: CreateReviewRequest): Promise<Review> {
    return apiClient.post<Review>("/reviews", data);
  },

  async getByJob(jobId: string): Promise<Review[]> {
    return apiClient.get<Review[]>(`/reviews/job/${jobId}`);
  },

  async getByUser(userId: string): Promise<Review[]> {
    return apiClient.get<Review[]>(`/reviews/user/${userId}`);
  },
};
