"use client";

import { ReactNode } from "react";
import {
  AuthProvider,
  ChatProvider,
  EntitlementProvider,
  NotificationProvider,
} from "@/contexts";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <EntitlementProvider>
        <NotificationProvider>
          <ChatProvider>{children}</ChatProvider>
        </NotificationProvider>
      </EntitlementProvider>
    </AuthProvider>
  );
}
