export interface PublicPlan {
  code: string;
  name: string;
  scope: "WORKER" | "EMPLOYER" | "ORGANIZATION";
  price: number;
  maxPostsPerMonth: number;
  postExpiryDays: number;
  featuredPosts: number;
  featureConfig: Record<string, boolean | number | string | null>;
}

export interface EntitlementSnapshot {
  plan: {
    code: string;
    name: string;
    scope: "WORKER" | "EMPLOYER" | "ORGANIZATION";
    price: number;
  } | null;
  verification: {
    level: string;
    isEkycVerified: boolean;
  };
  features: Record<string, boolean | number | string | null>;
}

export interface UsageSnapshotItem {
  featureKey: string;
  periodKey: string;
  count: number;
}
