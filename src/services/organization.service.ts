import apiClient from "@/lib/api-client";
import { User, Job } from "@/types";

export interface DashboardStats {
  activeJobs: number;
  totalApplicants: number;
  newApplicants: number;
  totalSpent: number;
}

export interface FinanceStats {
  balance: number;
  totalEscrowSpent: number;
  totalPaymentSpent: number;
  totalSpent: number;
  monthlySubscription: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  type: string;
}

export const organizationService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>("/organization/dashboard-stats");
  },

  async getFinanceStats(): Promise<FinanceStats> {
    return apiClient.get<FinanceStats>("/organization/finance-stats");
  },

  async getTransactions(): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>("/organization/transactions");
  },

  // Proxy to existing endpoints, but scoped cleanly here for the org dashboard
  async getStaff(): Promise<User[]> {
    return apiClient.get<User[]>("/users/recruiters");
  },

  async createStaff(data: any): Promise<User> {
    return apiClient.post<User>("/users/recruiters", data);
  },

  async getJobs(): Promise<Job[]> {
    const res: any = await apiClient.get<any>("/employer/jobs");
    return res.data || res;
  }
};
