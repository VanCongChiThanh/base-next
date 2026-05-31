"use client";

import { useState } from "react";
import { RoleGuard } from "@/components";
import { AdminSidebar, AdminHeader } from "@/components/admin";
import { Role } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={[Role.ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        {/* Content area — full width on mobile, margin on lg+ */}
        <div
          className={cn(
            "transition-all duration-300",
            // Mobile: no left margin (sidebar is overlay)
            "ml-0",
            // Desktop: leave space for sidebar
            collapsed ? "lg:ml-16" : "lg:ml-64",
          )}
        >
          <AdminHeader onMobileMenuToggle={() => setMobileOpen(true)} />
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
