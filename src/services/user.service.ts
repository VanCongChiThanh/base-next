import apiClient from "@/lib/api-client";
import { User } from "@/types";

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export const userService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get("/users/me");
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateUserRequest): Promise<User> {
    return apiClient.patch("/users/me", data);
  },
};

export default userService;
