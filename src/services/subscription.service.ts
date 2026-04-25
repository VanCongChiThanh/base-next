import apiClient from "@/lib/api-client";
import {
  CheckoutResponse,
  EntitlementSnapshot,
  PublicPlan,
  UsageSnapshotItem,
} from "@/types";

export const subscriptionService = {
  async getPublicPlans(scope?: string): Promise<PublicPlan[]> {
    const params = scope ? `?scope=${scope}` : "";
    return apiClient.get<PublicPlan[]>(`/subscriptions/plans/public${params}`);
  },

  async getMyEntitlements(): Promise<EntitlementSnapshot> {
    return apiClient.get<EntitlementSnapshot>("/subscriptions/me/entitlements");
  },

  async getMyUsage(): Promise<UsageSnapshotItem[]> {
    return apiClient.get<UsageSnapshotItem[]>("/subscriptions/me/usage");
  },

  async createCheckout(planCode: string): Promise<CheckoutResponse> {
    return apiClient.post<CheckoutResponse>("/subscriptions/checkout", {
      planCode,
    });
  },

  async syncCheckoutStatus(orderCode: string | number): Promise<{ status: string }> {
    return apiClient.get<{ status: string }>(`/subscriptions/checkout/sync/${orderCode}`);
  },
};

export default subscriptionService;
