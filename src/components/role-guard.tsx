"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { Role } from "@/types";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const hasRequiredRole = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasRequiredRole) {
        router.push("/unauthorized");
      }
    }
  }, [isLoading, isAuthenticated, hasRequiredRole, router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      )
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return fallback || null;
  }

  return <>{children}</>;
}

export default RoleGuard;
