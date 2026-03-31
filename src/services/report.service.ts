import { apiClient } from "@/lib/api-client";

export interface CreateReportRequest {
  targetId: string;
  targetType: "JOB" | "USER" | "REVIEW";
  reason: string;
  description?: string;
}

export const reportService = {
  createReport: async (data: CreateReportRequest) => {
    const res = await apiClient.post<any>("/reports", data);
    return res.data;
  },
};
