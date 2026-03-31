"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts";
import { jobService } from "@/services";
import { ApplicationChatMessage, ApplicationStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api-client";
import type { ApiError } from "@/types";

interface Props {
  applicationId: string;
  applicationStatus: ApplicationStatus;
  canAccess?: boolean;
  embedded?: boolean;
}

export function ApplicationChatPanel({
  applicationId,
  applicationStatus,
  canAccess = true,
  embedded = false,
}: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ApplicationChatMessage[]>([]);
  const [canSend, setCanSend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = useMemo(
    () => messages[messages.length - 1]?.id ?? null,
    [messages],
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!canAccess) return;
      if (applicationStatus !== ApplicationStatus.ACCEPTED) return;
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
    [applicationId, applicationStatus, canAccess],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canAccess || applicationStatus !== ApplicationStatus.ACCEPTED) return;

    const interval = setInterval(() => {
      // Poll nhẹ để cập nhật tin nhắn mới theo thời gian thực gần đúng.
      void load({ silent: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [applicationStatus, canAccess, load]);

  useEffect(() => {
    if (!lastMessageId) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lastMessageId]);

  const send = async () => {
    const t = text.trim();
    if (!canAccess || !t || !canSend) return;
    setSending(true);
    setError("");
    try {
      await jobService.postApplicationMessage(applicationId, t);
      setText("");
      await load();
    } catch (e) {
      setError(getErrorMessage(e as ApiError));
    } finally {
      setSending(false);
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

  if (applicationStatus !== ApplicationStatus.ACCEPTED) {
    return (
      <div className={`${embedded ? "p-4" : "mt-8"} rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600`}>
        Nhắn tin giữa người lao động và người đăng tin chỉ khả dụng khi đơn ứng
        tuyển ở trạng thái <strong>Đã chấp nhận</strong>.
      </div>
    );
  }

  return (
    <div className={wrapperBase}>
      {!embedded && (
        <>
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Nhắn tin công việc
            </h2>
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Theo từng đơn ứng tuyển
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Trao đổi trực tiếp trên đơn này. Sau khi hoàn thành ca, hệ thống khóa
            gửi tin mới; lịch sử vẫn xem được.
          </p>
        </>
      )}
      {error && <p className="text-sm text-red-600 mb-2 px-3">{error}</p>}
      <div
        ref={scrollerRef}
        className={`${embedded ? "flex-1" : "max-h-80"} overflow-y-auto space-y-3 mb-4 ${embedded ? "px-4 pt-2" : "border border-gray-100 rounded-xl p-3 bg-slate-50/80"}`}
      >
        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có tin nhắn.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={mine ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    mine
                      ? "max-w-[88%] rounded-2xl bg-blue-600 text-white px-3 py-2 shadow-sm"
                      : "max-w-[88%] rounded-2xl bg-white border border-slate-200 px-3 py-2 shadow-sm"
                  }
                >
                  {!mine && (
                    <p className="text-xs font-semibold text-slate-600 mb-1">
                      {m.sender.firstName} {m.sender.lastName}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {m.body}
                  </p>
                  <p
                    className={
                      mine
                        ? "text-[10px] text-blue-100 mt-1.5"
                        : "text-[10px] text-slate-400 mt-1.5"
                    }
                  >
                    {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {canSend ? (
        <div className={`flex gap-2 shrink-0 ${embedded ? "px-4 pb-4 pt-2 border-t border-gray-100 bg-white" : ""}`}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập tin nhắn..."
            rows={2}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            maxLength={4000}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !text.trim()}
            className="self-end px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 h-fit"
          >
            {sending ? "…" : "Gửi"}
          </button>
        </div>
      ) : (
        <p className={`text-sm text-gray-500 italic ${embedded ? "px-4 pb-4" : ""}`}>
          Cuộc trò chuyện đã đóng (không gửi tin mới sau khi hoàn thành ca).
        </p>
      )}
    </div>
  );
}
