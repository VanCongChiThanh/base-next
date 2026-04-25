import { apiClient } from "@/lib/api-client";
import { PaymentConfirmation, Dispute } from "@/types";

export const paymentService = {
  // Worker confirms receiving final payment
  confirmPayment(jobId: string, note?: string) {
    return apiClient.post<PaymentConfirmation>(
      `/jobs/${jobId}/confirm-payment`,
      {
        note,
      },
    );
  },

  // Get payment confirmations for a job
  getJobPayments(jobId: string) {
    return apiClient.get<PaymentConfirmation[]>(`/jobs/${jobId}/payments`);
  },

  // Get worker's own payments
  getMyPayments(page = 1, limit = 10) {
    return apiClient.get<{ data: PaymentConfirmation[], total: number }>(`/worker/payments?page=${page}&limit=${limit}`);
  },

  // Create a dispute for a job
  createDispute(jobId: string, reason: string) {
    return apiClient.post<Dispute>(`/jobs/${jobId}/disputes`, { reason });
  },

  // Get disputes for a job
  getJobDisputes(jobId: string) {
    return apiClient.get<Dispute[]>(`/jobs/${jobId}/disputes`);
  },
};
