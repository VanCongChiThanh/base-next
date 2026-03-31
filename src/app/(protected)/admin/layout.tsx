"use client";

import { useState } from "react";
import { RoleGuard } from "@/components";
import { AdminSidebar, AdminHeader } from "@/components/admin";
import { Role } from "@/types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <RoleGuard allowedRoles={[Role.ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <div
          className={`transition-all duration-300 ${collapsed ? "ml-16" : "ml-64"}`}
        >
          <AdminHeader />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
