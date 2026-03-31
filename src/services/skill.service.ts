import apiClient from "@/lib/api-client";
import { Skill } from "@/types";

export const skillService = {
  async getAll(): Promise<Skill[]> {
    return apiClient.get<Skill[]>("/skills");
  },
};
