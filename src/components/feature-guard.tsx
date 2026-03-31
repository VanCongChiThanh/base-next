"use client";

import { ReactNode } from "react";
import { useAuth, useEntitlements } from "@/contexts";

interface FeatureGuardProps {
  children: ReactNode;
  featureKey: string;
  expectedValue?: boolean | number | string;
  fallback?: ReactNode;
}

export function FeatureGuard({
  children,
  featureKey,
  expectedValue,
  fallback = null,
}: FeatureGuardProps) {
  const { isAuthenticated } = useAuth();
  const { hasFeature, isLoading } = useEntitlements();

  if (!isAuthenticated || isLoading) {
    return <>{fallback}</>;
  }

  if (!hasFeature(featureKey, expectedValue)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default FeatureGuard;
