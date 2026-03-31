"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { ApplicationStatus } from "@/types";
import { ChatDrawer } from "@/components/job/chat-drawer";

interface ChatState {
  applicationId: string;
  applicationStatus: ApplicationStatus;
  jobTitle?: string;
}

interface ChatContextType {
  isOpen: boolean;
  openChat: (
    applicationId: string,
    applicationStatus: ApplicationStatus,
    jobTitle?: string,
  ) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openChat = useCallback(
    (
      applicationId: string,
      applicationStatus: ApplicationStatus,
      jobTitle?: string,
    ) => {
      setState({ applicationId, applicationStatus, jobTitle });
      setIsOpen(true);
    },
    [],
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
    // Delay clearing state so exit animation can play
    setTimeout(() => setState(null), 300);
  }, []);

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
      {state && (
        <ChatDrawer
          isOpen={isOpen}
          applicationId={state.applicationId}
          applicationStatus={state.applicationStatus}
          jobTitle={state.jobTitle}
          onClose={closeChat}
        />
      )}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
