import { OrgSidebar } from '@/components/org/OrgSidebar';
import { OrgHeader } from '@/components/org/OrgHeader';

import { RoleGuard } from '@/components/role-guard';
import { Role } from '@/types';

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={[Role.ORGANIZATION]}>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        <OrgSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <OrgHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
