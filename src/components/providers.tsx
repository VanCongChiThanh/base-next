"use client";

import { ReactNode } from "react";
import {
  AuthProvider,
  ChatProvider,
  EntitlementProvider,
  NotificationProvider,
  LanguageProvider,
} from "@/contexts";

interface ProvidersProps {
  children: ReactNode;
}

import { Toaster } from "react-hot-toast";
import { AiChatWidget } from "@/components/ai/ai-chat-widget";

export function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <EntitlementProvider>
          <NotificationProvider>
            <ChatProvider>
              {children}
              <Toaster position="top-right" />
              <AiChatWidget />
            </ChatProvider>
          </NotificationProvider>
        </EntitlementProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
