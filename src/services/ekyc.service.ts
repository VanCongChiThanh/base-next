import apiClient from "@/lib/api-client";
import {
  EkycAccessTokenResponse,
  EkycSdkConfigResponse,
  VerifyEkycSignatureRequest,
  VerifyEkycSignatureResponse,
} from "@/types";

export const ekycService = {
  async getSdkConfig(): Promise<EkycSdkConfigResponse> {
    return apiClient.get<EkycSdkConfigResponse>("/ekyc/sdk-config");
  },

  async getAccessToken(): Promise<EkycAccessTokenResponse> {
    return apiClient.post<EkycAccessTokenResponse>("/ekyc/access-token");
  },

  async verifySignature(
    payload: VerifyEkycSignatureRequest,
  ): Promise<VerifyEkycSignatureResponse> {
    return apiClient.post<VerifyEkycSignatureResponse>(
      "/ekyc/verify-signature",
      payload,
    );
  },
};

export default ekycService;
