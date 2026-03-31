import apiClient from "@/lib/api-client";
import { Province, ProvinceDetail, Ward } from "@/types";

export const locationService = {
  async getProvinces(): Promise<Province[]> {
    return apiClient.get<Province[]>("/locations/provinces");
  },

  async getProvinceWithWards(code: string): Promise<ProvinceDetail> {
    return apiClient.get<ProvinceDetail>(`/locations/provinces/${code}`);
  },

  async getWard(code: string): Promise<Ward> {
    return apiClient.get<Ward>(`/locations/wards/${code}`);
  },
};
