import apiClient from "@/lib/api-client";
import { Skill } from "@/types";

export const skillService = {
  async getAll(): Promise<Skill[]> {
    return apiClient.get<Skill[]>("/skills");
  },
  async create(data: { name: string; description?: string }): Promise<Skill> {
    return apiClient.post<Skill>("/skills", data);
  },
  async update(id: string, data: { name?: string; description?: string }): Promise<Skill> {
    return apiClient.patch<Skill>(`/skills/${id}`, data);
  },
  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/skills/${id}`);
  }
};
