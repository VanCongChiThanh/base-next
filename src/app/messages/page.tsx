"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth-guard";
import { ApplicationChatPanel } from "@/components/job";
import { jobService } from "@/services";
import { ApplicationConversation } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

const MESSAGE_READ_KEY = "message_last_read_at_map_v1";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ApplicationConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!selectedConversation?.lastMessage?.createdAt) return;

    // Persist the latest read timestamp per conversation for unread-dot logic.
    const raw = localStorage.getItem(MESSAGE_READ_KEY);
    const readMap = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const applicationId = selectedConversation.applicationId;
    const currentReadAt = readMap[applicationId];
    const latestMessageAt = selectedConversation.lastMessage.createdAt;

    if (!currentReadAt || new Date(latestMessageAt).getTime() > new Date(currentReadAt).getTime()) {
      readMap[applicationId] = latestMessageAt;
      localStorage.setItem(MESSAGE_READ_KEY, JSON.stringify(readMap));
    }
  }, [selectedConversation]);

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="border-b border-blue-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Tin nhắn</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý tất cả trao đổi từ ứng tuyển, thuê ngay và thuê tôi.
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
            {loading && conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Đang tải hội thoại...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Chưa có hội thoại nào.</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const active = conversation.applicationId === selectedId;
                  const participantName = conversation.participant
                    ? `${conversation.participant.firstName} ${conversation.participant.lastName}`.trim()
                    : "Đối tác";

                  return (
                    <button
                      key={conversation.applicationId}
                      type="button"
                      onClick={() => setSelectedId(conversation.applicationId)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        active
                          ? "border-blue-300 bg-blue-50"
                          : "border-transparent hover:border-blue-100 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {conversation.jobTitle}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {participantName}
                          </p>
                        </div>
                        {conversation.isDirectHire && (
                          <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            Thuê ngay
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs text-gray-500">
                        {conversation.lastMessage?.body || "Chưa có tin nhắn"}
                      </p>
                      {conversation.lastMessage && (
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatRelativeTime(conversation.lastMessage.createdAt)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="h-[calc(100vh-180px)] min-h-[520px] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            {selectedConversation ? (
              <ApplicationChatPanel
                applicationId={selectedConversation.applicationId}
                applicationStatus={selectedConversation.applicationStatus}
                embedded
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Chọn một hội thoại để bắt đầu.
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </AuthGuard>
  );
}
