import apiClient from "@/lib/api-client";
import {
  CompleteEkycVerificationRequest,
  CompleteEkycVerificationResponse,
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

  async completeVerification(
    payload: CompleteEkycVerificationRequest,
  ): Promise<CompleteEkycVerificationResponse> {
    return apiClient.post<CompleteEkycVerificationResponse>(
      "/ekyc/complete",
      payload,
    );
  },
};

export default ekycService;
