import { apiClient } from "@/lib/api-client";
import { PaymentConfirmation, Dispute, Escrow, Milestone } from "@/types";

export const paymentService = {
  // ==================== PAYMENT CONFIRMATION (GIG / PART-TIME) ====================
  confirmPayment(jobId: string, note?: string) {
    return apiClient.post<PaymentConfirmation>(
      `/jobs/${jobId}/confirm-payment`,
      { note },
    );
  },

  getJobPayments(jobId: string) {
    return apiClient.get<PaymentConfirmation[]>(`/jobs/${jobId}/payments`);
  },

  getMyPayments(page = 1, limit = 10) {
    return apiClient.get<{ data: PaymentConfirmation[], total: number }>(`/worker/payments?page=${page}&limit=${limit}`);
  },

  // ==================== DISPUTES ====================
  createDispute(jobId: string, reason: string) {
    return apiClient.post<Dispute>(`/jobs/${jobId}/disputes`, { reason });
  },

  getJobDisputes(jobId: string) {
    return apiClient.get<Dispute[]>(`/jobs/${jobId}/disputes`);
  },

  // ==================== ESCROW (ONLINE JOBS) ====================
  createEscrow(jobId: string, milestones: { title: string; description?: string; amount: number }[]) {
    return apiClient.post<{ checkoutUrl: string; escrowId: string }>(`/escrow`, { jobId, milestones });
  },

  getEscrowByJob(jobId: string) {
    return apiClient.get<Escrow>(`/escrow/job/${jobId}`);
  },

  syncEscrowDeposit(orderCode: string | number) {
    return apiClient.get<{ status: string; escrowId: string }>(`/escrow/sync/${orderCode}`);
  },

  submitMilestone(milestoneId: string, note?: string) {
    return apiClient.post<Milestone>(`/escrow/milestones/${milestoneId}/submit`, { note });
  },

  reviewMilestone(milestoneId: string, action: 'approve' | 'request_revision', note?: string) {
    return apiClient.post<Milestone>(`/escrow/milestones/${milestoneId}/review`, { action, note });
  },

  proposeMilestone(jobId: string, data: { title: string; description?: string; amount?: number }) {
    return apiClient.post<Milestone>(`/escrow/milestones/${jobId}/propose`, data);
  },

  respondToProposal(milestoneId: string, accept: boolean) {
    return apiClient.post<{ accepted: boolean; milestone?: Milestone }>(`/escrow/milestones/${milestoneId}/respond-proposal`, { accept });
  },
};

