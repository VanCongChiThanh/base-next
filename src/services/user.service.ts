import apiClient from "@/lib/api-client";
import { User, BankAccount, CreateBankAccountRequest, UpdateBankAccountRequest } from "@/types";

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

  // Bank Accounts
  async getBankAccounts(): Promise<BankAccount[]> {
    return apiClient.get("/users/me/bank-accounts");
  },

  async addBankAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
    return apiClient.post("/users/me/bank-accounts", data);
  },

  async updateBankAccount(id: string, data: UpdateBankAccountRequest): Promise<BankAccount> {
    return apiClient.patch(`/users/me/bank-accounts/${id}`, data);
  },

  async deleteBankAccount(id: string): Promise<void> {
    return apiClient.delete(`/users/me/bank-accounts/${id}`);
  }
};

export default userService;
