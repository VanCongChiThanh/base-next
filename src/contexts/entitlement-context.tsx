"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { subscriptionService } from "@/services";
import { ApiError } from "@/types";
import { EntitlementSnapshot, UsageSnapshotItem } from "@/types";
import { useAuth } from "./auth-context";

interface EntitlementContextType {
  entitlements: EntitlementSnapshot | null;
  usage: UsageSnapshotItem[];
  isLoading: boolean;
  refreshEntitlements: () => Promise<void>;
  hasFeature: (
    featureKey: string,
    expectedValue?: boolean | number | string,
  ) => boolean;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(
  undefined,
);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<EntitlementSnapshot | null>(
    null,
  );
  const [usage, setUsage] = useState<UsageSnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshEntitlements = useCallback(async () => {
    if (!isAuthenticated) {
      setEntitlements(null);
      setUsage([]);
      return;
    }

    try {
      setIsLoading(true);
      const [entitlementData, usageData] = await Promise.all([
        subscriptionService.getMyEntitlements(),
        subscriptionService.getMyUsage(),
      ]);

      setEntitlements(entitlementData);
      setUsage(usageData);
    } catch (error) {
      const apiError = error as ApiError;
      // Keep UI stable when backend routes are not ready or temporarily unavailable.
      if (apiError?.statusCode === 404 || apiError?.statusCode >= 500) {
        setEntitlements(null);
        setUsage([]);
        return;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshEntitlements();
  }, [refreshEntitlements]);

  const hasFeature = useCallback(
    (
      featureKey: string,
      expectedValue?: boolean | number | string,
    ): boolean => {
      const value = entitlements?.features?.[featureKey];

      if (expectedValue !== undefined) {
        return value === expectedValue;
      }

      return Boolean(value);
    },
    [entitlements],
  );

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        usage,
        isLoading,
        refreshEntitlements,
        hasFeature,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error(
      "useEntitlements must be used within an EntitlementProvider",
    );
  }

  return context;
}
