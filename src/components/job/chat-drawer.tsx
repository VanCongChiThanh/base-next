"use client";

import { useEffect, useRef } from "react";
import { ApplicationStatus } from "@/types";
import { ApplicationChatPanel } from "./application-chat-panel";

interface ChatDrawerProps {
  isOpen: boolean;
  applicationId: string;
  applicationStatus: ApplicationStatus;
  jobTitle?: string;
  onClose: () => void;
}

export function ChatDrawer({
  isOpen,
  applicationId,
  applicationStatus,
  jobTitle,
  onClose,
}: ChatDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Chat"
        className={`
          fixed z-[9999] bg-white shadow-2xl
          transition-transform duration-300 ease-out
          flex flex-col

          /* Mobile: full-screen bottom sheet */
          inset-0

          /* Tablet (md): right drawer, max 420px */
          md:inset-y-0 md:left-auto md:right-0
          md:w-[420px] md:max-w-[90vw]
          md:rounded-l-2xl

          /* Desktop (lg): narrower right drawer */
          lg:w-[440px]

          ${isOpen
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-sky-50 shrink-0 md:rounded-tl-2xl">
          {/* Mobile drag indicator */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 md:hidden" />

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shrink-0 shadow-sm"
            aria-label="Đóng chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {jobTitle || "Nhắn tin công việc"}
            </h2>
            <p className="text-[11px] text-gray-500">Theo đơn ứng tuyển</p>
          </div>

          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
            Live
          </span>
        </div>

        {/* Chat content — takes remaining space */}
        <div className="flex-1 overflow-y-auto">
          <ApplicationChatPanel
            applicationId={applicationId}
            applicationStatus={applicationStatus}
            canAccess={true}
            embedded={true}
          />
        </div>
      </div>
    </>
  );
}
