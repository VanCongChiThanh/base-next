"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth-guard";
import { ApplicationChatPanel } from "@/components/job";
import { jobService } from "@/services";
import { ApplicationConversation } from "@/types";
import { formatRelativeTime, getInitials } from "@/lib/utils";

const MESSAGE_READ_KEY = "message_last_read_at_map_v1";

function getReadMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(MESSAGE_READ_KEY);
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}

function isUnread(conversation: ApplicationConversation): boolean {
  if (!conversation.lastMessage?.createdAt) return false;
  const readMap = getReadMap();
  const readAt = readMap[conversation.applicationId];
  if (!readAt) return true;
  return new Date(conversation.lastMessage.createdAt).getTime() > new Date(readAt).getTime();
}

function markRead(applicationId: string, lastMessageAt: string) {
  const readMap = getReadMap();
  readMap[applicationId] = lastMessageAt;
  localStorage.setItem(MESSAGE_READ_KEY, JSON.stringify(readMap));
}

// Simple avatar component inline for conversation list
function ConversationAvatar({ firstName, lastName, avatarUrl }: { firstName?: string; lastName?: string; avatarUrl?: string | null }) {
  const initials = getInitials(firstName, lastName);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white text-sm font-bold">
      {initials || "?"}
    </div>
  );
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ApplicationConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Mobile view: "list" shows conversation list, "chat" shows chat panel
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await jobService.getMyConversations();
        if (cancelled) return;
        setConversations(data);
        setSelectedId((current) => current || data[0]?.applicationId || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.applicationId === selectedId) || null,
    [conversations, selectedId],
  );

  // Mark as read when selecting a conversation
  useEffect(() => {
    if (!selectedConversation?.lastMessage?.createdAt) return;
    markRead(selectedConversation.applicationId, selectedConversation.lastMessage.createdAt);
  }, [selectedConversation]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.jobTitle?.toLowerCase().includes(q) ||
        `${c.participant?.firstName ?? ""} ${c.participant?.lastName ?? ""}`.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const handleSelectConversation = (applicationId: string) => {
    setSelectedId(applicationId);
    setMobileView("chat");
  };

  const selectedParticipant = selectedConversation?.participant;

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        {/* Page header — hidden on mobile when in chat view */}
        <div className={`border-b border-blue-100 bg-white ${mobileView === "chat" ? "hidden lg:block" : ""}`}>
          <div className="mx-auto max-w-6xl px-4 py-4 sm:py-5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tin nhắn</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Quản lý tất cả trao đổi từ ứng tuyển, thuê ngay và thuê tôi.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-0 sm:px-4 py-0 sm:py-4 lg:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0 sm:gap-4 lg:gap-4">

            {/* ── Conversation List ── */}
            <aside
              className={`
                bg-white sm:rounded-2xl border-0 sm:border border-blue-100 shadow-sm
                flex flex-col
                ${mobileView === "chat" ? "hidden lg:flex" : "flex"}
                h-[calc(100dvh-130px)] sm:h-auto sm:max-h-[calc(100dvh-160px)] lg:h-[calc(100dvh-160px)]
              `}
            >
              {/* Search bar */}
              <div className="p-3 border-b border-gray-100 shrink-0">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo công việc hoặc người..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loading && conversations.length === 0 ? (
                  /* Loading skeletons */
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                      <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {search ? "Không tìm thấy hội thoại" : "Chưa có hội thoại nào"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search ? "Thử tìm với từ khóa khác" : "Ứng tuyển hoặc đăng việc để bắt đầu nhắn tin"}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-0.5">
                    {filteredConversations.map((conversation) => {
                      const active = conversation.applicationId === selectedId;
                      const participantName = conversation.participant
                        ? `${conversation.participant.firstName} ${conversation.participant.lastName}`.trim()
                        : "Đối tác";
                      const unread = !active && isUnread(conversation);

                      return (
                        <button
                          key={conversation.applicationId}
                          type="button"
                          onClick={() => handleSelectConversation(conversation.applicationId)}
                          className={`w-full rounded-xl px-3 py-3 text-left transition-all group ${
                            active
                              ? "bg-blue-50 ring-1 ring-blue-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <ConversationAvatar
                                firstName={conversation.participant?.firstName}
                                lastName={conversation.participant?.lastName}
                                avatarUrl={conversation.participant?.avatarUrl}
                              />
                              {unread && (
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className={`truncate text-sm leading-tight ${unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                                    {conversation.jobTitle}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-gray-500">{participantName}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  {conversation.lastMessage && (
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                      {formatRelativeTime(conversation.lastMessage.createdAt)}
                                    </span>
                                  )}
                                  {conversation.isDirectHire && (
                                    <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 border border-indigo-100">
                                      Thuê ngay
                                    </span>
                                  )}
                                  {unread && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  )}
                                </div>
                              </div>
                              <p className={`mt-1.5 line-clamp-1 text-xs ${unread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                                {conversation.lastMessage?.body || "Chưa có tin nhắn"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            {/* ── Chat Panel ── */}
            <section
              className={`
                bg-white sm:rounded-2xl border-0 sm:border border-blue-100 shadow-sm overflow-hidden
                flex flex-col
                ${mobileView === "list" ? "hidden lg:flex" : "flex"}
                h-[calc(100dvh-64px)] sm:h-auto lg:h-[calc(100dvh-160px)]
              `}
            >
              {/* Mobile back header */}
              {mobileView === "chat" && (
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
                  <button
                    onClick={() => setMobileView("list")}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  {selectedConversation && (
                    <>
                      <ConversationAvatar
                        firstName={selectedParticipant?.firstName}
                        lastName={selectedParticipant?.lastName}
                        avatarUrl={selectedParticipant?.avatarUrl}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedConversation.jobTitle}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {selectedParticipant
                            ? `${selectedParticipant.firstName} ${selectedParticipant.lastName}`
                            : "Đối tác"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedConversation ? (
                <ApplicationChatPanel
                  applicationId={selectedConversation.applicationId}
                  applicationStatus={selectedConversation.applicationStatus}
                  embedded
                />
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-center px-6 py-12">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-700">Chọn một hội thoại</p>
                  <p className="mt-1 text-sm text-gray-400">để bắt đầu nhắn tin với đối tác của bạn</p>
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </AuthGuard>
  );
}
