import apiClient from "@/lib/api-client";
import {
  WorkerService,
  CreateWorkerServiceRequest,
  WorkerServiceFilterParams,
  ApiSuccessResponse,
} from "@/types";

export const workerServiceAPI = {
  async findServices(
    params: WorkerServiceFilterParams = {},
  ): Promise<ApiSuccessResponse<WorkerService[]>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params.provinceCode) searchParams.set("provinceCode", params.provinceCode);
    if (params.wardCode) searchParams.set("wardCode", params.wardCode);
    if (params.search) searchParams.set("search", params.search);
    if (params.type) searchParams.set("type", params.type);
    if (params.isAvailableNow !== undefined) searchParams.set("isAvailableNow", String(params.isAvailableNow));
    if (params.minPrice !== undefined) searchParams.set("minPrice", String(params.minPrice));
    if (params.maxPrice !== undefined) searchParams.set("maxPrice", String(params.maxPrice));

    const qs = searchParams.toString();
    return apiClient.getFull<WorkerService[]>(`/worker-services${qs ? `?${qs}` : ""}`);
  },

  async searchCandidatesByAi(query: string): Promise<WorkerService[]> {
    return apiClient.get<WorkerService[]>(`/ai/search-candidates?q=${encodeURIComponent(query)}`);
  },

  async getService(id: string): Promise<WorkerService> {
    return apiClient.get<WorkerService>(`/worker-services/${id}`);
  },

  async createService(data: CreateWorkerServiceRequest): Promise<WorkerService> {
    return apiClient.post<WorkerService>("/worker-services", data);
  },

  async getMyServices(): Promise<WorkerService[]> {
    return apiClient.get<WorkerService[]>("/worker-services/my-services");
  },

  async getServicesByWorker(workerId: string): Promise<WorkerService[]> {
    return apiClient.get<WorkerService[]>(`/worker-services/worker/${workerId}`);
  },

  async updateService(id: string, data: Partial<CreateWorkerServiceRequest>): Promise<WorkerService> {
    return apiClient.patch<WorkerService>(`/worker-services/${id}`, data);
  },

  async deleteService(id: string): Promise<void> {
    return apiClient.delete(`/worker-services/${id}`);
  },
};
