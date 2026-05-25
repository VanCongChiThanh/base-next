"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts";
import { jobService } from "@/services";
import { ApplicationChatMessage, ApplicationStatus } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api-client";
import type { ApiError } from "@/types";

interface Props {
  applicationId: string;
  applicationStatus: ApplicationStatus;
  canAccess?: boolean;
  embedded?: boolean;
}

/** Optimistic message — shown immediately while sending */
interface OptimisticMessage extends ApplicationChatMessage {
  isOptimistic?: boolean;
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(dateStr, today.toISOString())) return "Hôm nay";
  if (isSameDay(dateStr, yesterday.toISOString())) return "Hôm qua";
  return formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ChatAvatar({ firstName, lastName, avatarUrl, mine }: { firstName?: string; lastName?: string; avatarUrl?: string | null; mine: boolean }) {
  if (mine) return null;
  const initials = getInitials(firstName, lastName);
  if (avatarUrl) {
    return <img src={avatarUrl} alt={`${firstName}`} className="w-7 h-7 rounded-full object-cover shrink-0 self-end" />;
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shrink-0 self-end text-white text-[10px] font-bold">
      {initials || "?"}
    </div>
  );
}

export function ApplicationChatPanel({
  applicationId,
  applicationStatus,
  canAccess = true,
  embedded = false,
}: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [canSend, setCanSend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const lastRealMessageId = useMemo(
    () => messages.filter((m) => !m.isOptimistic).at(-1)?.id ?? null,
    [messages],
  );

  const isChatActive =
    applicationStatus === ApplicationStatus.ACCEPTED ||
    applicationStatus === ApplicationStatus.EMPLOYER_ACCEPTED;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!canAccess) return;
      if (!isChatActive) return;
      if (!options?.silent) {
        setLoading(true);
      }
      setError("");
      try {
        const data = await jobService.getApplicationMessages(applicationId);
        setMessages(data.messages);
        setCanSend(data.canSend);
      } catch (e) {
        setError(getErrorMessage(e as ApiError));
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [applicationId, canAccess, isChatActive],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Polling every 3s
  useEffect(() => {
    if (!canAccess || !isChatActive) return;
    const interval = setInterval(() => {
      void load({ silent: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [canAccess, isChatActive, load]);

  // Auto-scroll on new real messages
  useEffect(() => {
    if (!lastRealMessageId) return;
    scrollToBottom("smooth");
  }, [lastRealMessageId, scrollToBottom]);

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  const send = async () => {
    const t = text.trim();
    if (!canAccess || !t || !canSend || sending) return;

    // Optimistic update — add fake message immediately
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: OptimisticMessage = {
      id: optimisticId,
      body: t,
      createdAt: new Date().toISOString(),
      senderId: user?.id ?? "",
      sender: {
        id: user?.id ?? "",
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        avatarUrl: user?.avatarUrl ?? null,
      },
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setTimeout(() => scrollToBottom("smooth"), 50);

    setSending(true);
    setError("");
    try {
      await jobService.postApplicationMessage(applicationId, t);
      // Reload to get real messages (removes optimistic)
      await load({ silent: true });
    } catch (e) {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setError(getErrorMessage(e as ApiError));
      setText(t); // restore text
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const wrapperBase = embedded
    ? "flex flex-col h-full"
    : "mt-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm flex flex-col";

  if (!canAccess) {
    return (
      <div className={`${embedded ? "p-4" : "mt-8"} rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800`}>
        Bạn không có quyền mở cuộc trò chuyện của đơn ứng tuyển này.
      </div>
    );
  }

  if (!isChatActive) {
    return (
      <div className={`${embedded ? "p-4" : "mt-8"} rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600`}>
        Nhắn tin giữa người lao động và người đăng tin chỉ khả dụng khi đơn ứng
        tuyển ở trạng thái <strong>Đã chấp nhận</strong>.
      </div>
    );
  }

  // Group messages by sender for consecutive runs
  const messageGroups = messages.reduce<{ message: OptimisticMessage; showAvatar: boolean; showSender: boolean }[]>(
    (acc, msg, idx) => {
      const prev = messages[idx - 1];
      const next = messages[idx + 1];
      const mine = msg.senderId === user?.id;
      const prevSame = prev && prev.senderId === msg.senderId;
      const nextSame = next && next.senderId === msg.senderId;
      // Show avatar on the last message of a group (bottom)
      const showAvatar = !mine && !nextSame;
      // Show sender name on the first message of a group (top)
      const showSender = !mine && !prevSame;
      acc.push({ message: msg, showAvatar, showSender });
      return acc;
    },
    [],
  );

  return (
    <div className={wrapperBase}>
      {!embedded && (
        <>
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="text-lg font-semibold text-gray-900">Nhắn tin công việc</h2>
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Theo từng đơn ứng tuyển
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Trao đổi trực tiếp trên đơn này. Sau khi hoàn thành ca, hệ thống khóa gửi tin mới; lịch sử vẫn xem được.
          </p>
        </>
      )}

      {error && (
        <div className={`flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2 ${embedded ? "mx-3 mt-2" : ""}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollerRef}
        className={`
          overflow-y-auto
          ${embedded
            ? "flex-1 px-3 pt-3 pb-2"
            : "max-h-80 border border-gray-100 rounded-xl p-3 bg-slate-50/80"
          }
        `}
      >
        {loading ? (
          <div className="flex flex-col gap-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`h-10 rounded-2xl bg-gray-100 animate-pulse ${i % 2 === 0 ? "w-40" : "w-52"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Chưa có tin nhắn</p>
            <p className="text-xs text-gray-400 mt-0.5">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messageGroups.map(({ message: m, showAvatar, showSender }, idx) => {
              const mine = m.senderId === user?.id;
              // Date separator
              const prevMsg = messages[idx - 1];
              const showDateSep = idx === 0 || (prevMsg && !isSameDay(prevMsg.createdAt, m.createdAt));

              return (
                <div key={m.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[10px] font-medium text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                        {getDayLabel(m.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}

                  <div className={`flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"} ${idx > 0 && messages[idx - 1].senderId === m.senderId ? "mt-0.5" : "mt-2"}`}>
                    {/* Other person avatar placeholder (space for alignment) */}
                    {!mine && (
                      showAvatar
                        ? <ChatAvatar firstName={m.sender.firstName} lastName={m.sender.lastName} avatarUrl={m.sender.avatarUrl} mine={false} />
                        : <div className="w-7 shrink-0" />
                    )}

                    <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[78%]`}>
                      {showSender && (
                        <span className="text-[10px] font-semibold text-slate-500 mb-0.5 px-1">
                          {m.sender.firstName} {m.sender.lastName}
                        </span>
                      )}
                      <div
                        className={
                          mine
                            ? `rounded-2xl rounded-br-sm px-3.5 py-2 shadow-sm ${m.isOptimistic ? "bg-blue-400 text-white opacity-80" : "bg-blue-600 text-white"}`
                            : "rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-3.5 py-2 shadow-sm"
                        }
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {m.body}
                        </p>
                        <div className={`flex items-center gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
                          <p className={mine ? "text-[10px] text-blue-100" : "text-[10px] text-slate-400"}>
                            {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {m.isOptimistic && (
                            <svg className="w-3 h-3 text-blue-200 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input area */}
      {canSend ? (
        <div className={`shrink-0 ${embedded ? "px-3 pb-3 pt-2 border-t border-gray-100 bg-white" : "mt-3"}`}>
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-3 py-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none text-gray-800 placeholder:text-gray-400 max-h-[120px] overflow-y-auto"
              maxLength={4000}
              style={{ height: "auto" }}
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !text.trim()}
              className="shrink-0 p-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all self-end"
              title="Gửi tin nhắn"
            >
              {sending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 px-1">
            {text.length > 0 ? `${text.length}/4000 ký tự` : "Shift+Enter để xuống dòng"}
          </p>
        </div>
      ) : (
        <p className={`text-sm text-gray-500 italic shrink-0 ${embedded ? "px-4 pb-4 pt-2 border-t border-gray-100" : "mt-3"}`}>
          Cuộc trò chuyện đã đóng (không gửi tin mới sau khi hoàn thành ca).
        </p>
      )}
    </div>
  );
}
