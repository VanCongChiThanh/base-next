import apiClient from "@/lib/api-client";
import {
  WorkerProfile,
  EmployerProfile,
  CreateWorkerProfileRequest,
  CreateEmployerProfileRequest,
  WorkerPrivacySettings,
  EmployerPrivacySettings,
} from "@/types";

export const profileService = {
  // Worker Profile
  async getWorkerProfile(): Promise<WorkerProfile> {
    return apiClient.get<WorkerProfile>("/profiles/worker/me");
  },

  async createWorkerProfile(
    data: CreateWorkerProfileRequest,
  ): Promise<WorkerProfile> {
    return apiClient.post<WorkerProfile>("/profiles/worker", data);
  },

  async updateWorkerProfile(
    data: Partial<CreateWorkerProfileRequest>,
  ): Promise<WorkerProfile> {
    return apiClient.patch<WorkerProfile>("/profiles/worker/me", data);
  },

  async updateWorkerPrivacy(settings: Partial<WorkerPrivacySettings>): Promise<WorkerProfile> {
    return apiClient.patch<WorkerProfile>("/profiles/worker/me/privacy", { privacySettings: settings });
  },

  // Employer Profile
  async getEmployerProfile(): Promise<EmployerProfile> {
    return apiClient.get<EmployerProfile>("/profiles/employer/me");
  },

  async createEmployerProfile(
    data: CreateEmployerProfileRequest,
  ): Promise<EmployerProfile> {
    return apiClient.post<EmployerProfile>("/profiles/employer", data);
  },

  async updateEmployerProfile(
    data: Partial<CreateEmployerProfileRequest>,
  ): Promise<EmployerProfile> {
    return apiClient.patch<EmployerProfile>("/profiles/employer/me", data);
  },

  async updateEmployerPrivacy(settings: Partial<EmployerPrivacySettings>): Promise<EmployerProfile> {
    return apiClient.patch<EmployerProfile>("/profiles/employer/me/privacy", { privacySettings: settings });
  },
};
