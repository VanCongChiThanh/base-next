import apiClient from "@/lib/api-client";
import {
  Job,
  JobApplication,
  JobFilterParams,
  CreateJobRequest,
  ApplyJobRequest,
  ApplicationProgress,
  ApplicationChatResponse,
  ApplicationConversation,
  PaymentConfirmation,
} from "@/types";
import { ApiSuccessResponse } from "@/types";

export const jobService = {
  async findJobs(
    params: JobFilterParams = {},
  ): Promise<ApiSuccessResponse<Job[]>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.provinceCode)
      searchParams.set("provinceCode", params.provinceCode);
    if (params.wardCode) searchParams.set("wardCode", params.wardCode);
    if (params.category) searchParams.set("category", params.category);
    if (params.salaryMin)
      searchParams.set("salaryMin", String(params.salaryMin));
    if (params.salaryMax)
      searchParams.set("salaryMax", String(params.salaryMax));
    if (params.search) searchParams.set("search", params.search);
    if (params.latitude !== undefined) searchParams.set("latitude", String(params.latitude));
    if (params.longitude !== undefined) searchParams.set("longitude", String(params.longitude));
    if (params.radius !== undefined) searchParams.set("radius", String(params.radius));
    if (params.jobType) searchParams.set("jobType", params.jobType);

    const qs = searchParams.toString();
    return apiClient.getFull<Job[]>(`/jobs${qs ? `?${qs}` : ""}`);
  },

  async getJob(id: string): Promise<Job> {
    return apiClient.get<Job>(`/jobs/${id}`);
  },

  async createJob(data: CreateJobRequest): Promise<Job> {
    return apiClient.post<Job>("/jobs", data);
  },

  async getMyJobs(): Promise<Job[]> {
    const result = await apiClient.get<{ data: Job[]; total: number }>(
      "/employer/jobs",
    );
    return (
      (result as unknown as { data: Job[] }).data ??
      (result as unknown as Job[])
    );
  },

  async cancelJob(id: string): Promise<Job> {
    return apiClient.post<Job>(`/jobs/${id}/cancel`);
  },

  async negotiateDirectHirePrice(jobId: string, proposedPrice: number): Promise<JobApplication> {
    return apiClient.put<JobApplication>(`/jobs/${jobId}/negotiate-price`, { proposedPrice });
  },

  async applyForJob(
    jobId: string,
    data: ApplyJobRequest,
  ): Promise<JobApplication> {
    return apiClient.post<JobApplication>(`/jobs/${jobId}/apply`, data);
  },

  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    return apiClient.get<JobApplication[]>(`/jobs/${jobId}/applications`);
  },

  async getMyApplication(jobId: string): Promise<JobApplication | null> {
    try {
      return await apiClient.get<JobApplication>(`/jobs/${jobId}/my-application`);
    } catch (error: any) {
      if (error?.status === 404 || error?.response?.status === 404) return null;
      throw error;
    }
  },

  async acceptApplication(
    jobId: string,
    applicationId: string,
  ): Promise<JobApplication> {
    return apiClient.post<JobApplication>(
      `/applications/${applicationId}/accept`,
    );
  },

  async rejectApplication(
    jobId: string,
    applicationId: string,
  ): Promise<JobApplication> {
    return apiClient.post<JobApplication>(
      `/applications/${applicationId}/reject`,
    );
  },

  async respondApplicationAcceptance(
    applicationId: string,
    accept: boolean,
  ): Promise<JobApplication> {
    return apiClient.post<JobApplication>(
      `/applications/${applicationId}/respond-acceptance`,
      { accept },
    );
  },

  async confirmPayment(id: string): Promise<PaymentConfirmation> {
    return apiClient.post<PaymentConfirmation>(`/jobs/${id}/confirm-payment`);
  },

  // Invitations
  async inviteWorkerToJob(jobId: string, workerId: string): Promise<any> {
    return apiClient.post(`/jobs/${jobId}/invite`, { workerId });
  },

  async respondToInvitation(invitationId: string, accept: boolean): Promise<any> {
    return apiClient.post(`/invitations/${invitationId}/respond`, { accept });
  },

  async getMyInvitations(): Promise<any[]> {
    return apiClient.get(`/invitations/my-invitations`);
  },

  async completeJob(id: string): Promise<Job> {
    return apiClient.post<Job>(`/jobs/${id}/complete`);
  },

  async completeAssignment(jobId: string): Promise<any> {
    return apiClient.post(`/jobs/${jobId}/complete-assignment`);
  },

  async logHours(jobId: string, loggedHours: number): Promise<any> {
    return apiClient.post(`/jobs/${jobId}/log-hours`, { loggedHours });
  },

  async confirmHours(jobId: string): Promise<any> {
    return apiClient.post(`/jobs/${jobId}/confirm-hours`);
  },

  async markPaid(jobId: string): Promise<any> {
    return apiClient.post(`/jobs/${jobId}/mark-paid`);
  },

  async confirmPaymentReceipt(jobId: string): Promise<any> {
    return apiClient.post(`/jobs/${jobId}/confirm-payment-receipt`);
  },

  async getWorkerHistory(): Promise<JobApplication[]> {
    const result = await apiClient.get<{
      data: JobApplication[];
      total: number;
    }>("/worker/job-history");
    return (
      (result as unknown as { data: JobApplication[] }).data ??
      (result as unknown as JobApplication[])
    );
  },

  async checkIn(jobId: string, notes?: string): Promise<unknown> {
    return apiClient.post(`/jobs/${jobId}/check-in`, { notes });
  },

  async cancelApplication(applicationId: string): Promise<JobApplication> {
    return apiClient.post<JobApplication>(`/applications/${applicationId}/cancel`);
  },

  async getApplicationProgress(applicationId: string): Promise<ApplicationProgress> {
    return apiClient.get<ApplicationProgress>(`/applications/${applicationId}/progress`);
  },

  async getJobProgress(jobId: string): Promise<{ total: number; workers: ApplicationProgress[] }> {
    return apiClient.get(`/jobs/${jobId}/progress`);
  },

  async getApplicationMessages(
    applicationId: string,
  ): Promise<ApplicationChatResponse> {
    return apiClient.get<ApplicationChatResponse>(
      `/applications/${applicationId}/messages`,
    );
  },

  async getMyConversations(): Promise<ApplicationConversation[]> {
    return apiClient.get<ApplicationConversation[]>(`/applications/my-conversations`);
  },

  async postApplicationMessage(
    applicationId: string,
    body: string,
  ): Promise<{ id: string; createdAt: string }> {
    return apiClient.post(`/applications/${applicationId}/messages`, { body });
  },
};
