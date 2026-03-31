import apiClient from "@/lib/api-client";
import { EntitlementSnapshot, PublicPlan, UsageSnapshotItem } from "@/types";

export const subscriptionService = {
  async getPublicPlans(): Promise<PublicPlan[]> {
    return apiClient.get<PublicPlan[]>("/subscriptions/plans/public");
  },

  async getMyEntitlements(): Promise<EntitlementSnapshot> {
    return apiClient.get<EntitlementSnapshot>("/subscriptions/me/entitlements");
  },

  async getMyUsage(): Promise<UsageSnapshotItem[]> {
    return apiClient.get<UsageSnapshotItem[]>("/subscriptions/me/usage");
  },
};

export default subscriptionService;
