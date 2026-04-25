"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { sendChatMessageStream, getChatSuggestions } from "@/services/ai.service";
import type { ChatReference, JobReference, WorkerReference, PlatformLink } from "@/services/ai.service";
import { useAuth } from "@/contexts";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  references?: ChatReference[];
}

type LegacyReference = {
  title: string;
  url: string;
  type?: "job" | "worker" | "platform";
  salary?: string;
  location?: string;
  category?: string;
  price?: string;
  isAvailable?: boolean;
  description?: string;
};

// ─── Simple inline markdown renderer ────────────────────────────────────────
// Handles **bold**, *italic*, bullet lists (- / *), numbered lists, line breaks.
// No external dependency — keeps bundle tiny.

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let key = 0;

  const renderInline = (line: string) => {
    // Replace **bold** and *italic*
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Numbered list: starts with digit + dot
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-0.5 my-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list: starts with - or *
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line → small gap
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
      i++;
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={key++} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Reference card components ───────────────────────────────────────────────

function StarRating({ rating }: { rating?: number }) {
  if (!rating || rating <= 0) return null;
  const r = Math.round(rating * 10) / 10;
  return (
    <span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-medium">
      <svg className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {r.toFixed(1)}
    </span>
  );
}

function JobCard({ item }: { item: JobReference & { rating?: number } }) {
  return (
    <Link
      href={item.url}
      className="flex flex-col gap-1.5 bg-gradient-to-br from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 border border-blue-100 hover:border-blue-300 px-3 py-2.5 rounded-xl transition-all group shadow-sm hover:shadow-md"
    >
      <span className="text-xs font-semibold text-blue-700 group-hover:text-blue-800 line-clamp-1">
        {item.title}
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {item.salary && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {item.salary}
          </span>
        )}
        {item.location && (
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate max-w-[120px]">{item.location}</span>
          </span>
        )}
        {item.category && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{item.category}</span>
        )}
        <StarRating rating={(item as any).rating} />
      </div>
    </Link>
  );
}

function WorkerCard({ item }: { item: WorkerReference & { rating?: number; skills?: string[] } }) {
  return (
    <Link
      href={item.url}
      className="flex flex-col gap-1.5 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-100 hover:border-violet-300 px-3 py-2.5 rounded-xl transition-all group shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-violet-700 group-hover:text-violet-800 truncate">
          {item.title}
        </span>
        {item.isAvailable !== undefined && (
          <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            item.isAvailable ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
          }`}>
            {item.isAvailable ? "🟢 Sẵn sàng" : "Đang bận"}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {item.price && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {item.price}
          </span>
        )}
        {item.location && (
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {item.location}
          </span>
        )}
        <StarRating rating={(item as any).rating} />
      </div>
      {(item as any).skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {((item as any).skills as string[]).slice(0, 3).map((s: string, i: number) => (
            <span key={i} className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

function PlatformActionLink({ item }: { item: PlatformLink }) {
  return (
    <Link
      href={item.url}
      className="flex items-center gap-2.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 px-3 py-2 rounded-xl transition-all group"
    >
      <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
          {item.title}
        </p>
        {item.description && (
          <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
        )}
      </div>
    </Link>
  );
}

function extractLegacyJobDetails(content: string): { salary?: string; location?: string } {
  const locationMatch = content.match(/Địa điểm:\s*([^\n*]+)/i);
  const salaryMatch = content.match(/Lương:\s*([^\n*]+)/i);
  const location = locationMatch?.[1]?.trim();
  const salary = salaryMatch?.[1]?.trim();
  return {
    salary: salary && salary.length > 0 ? salary : undefined,
    location: location && location.length > 0 ? location : undefined,
  };
}

function normalizeReferences(
  rawReferences: ChatReference[] | undefined,
  content: string
): ChatReference[] {
  if (!rawReferences || rawReferences.length === 0) return [];
  const fallback = extractLegacyJobDetails(content);

  return rawReferences.map((raw) => {
    const r = raw as LegacyReference;

    // New typed payload from backend
    if (r.type === "job" || r.type === "worker" || r.type === "platform") {
      return raw;
    }

    // Legacy payload: infer by URL
    if (r.url?.startsWith("/jobs/")) {
      return {
        type: "job",
        title: r.title,
        url: r.url,
        salary: r.salary ?? fallback.salary,
        location: r.location ?? fallback.location,
        category: r.category,
      } as JobReference;
    }

    if (r.url?.startsWith("/users/")) {
      return {
        type: "worker",
        title: r.title,
        url: r.url,
        price: r.price,
        location: r.location,
        isAvailable: r.isAvailable,
      } as WorkerReference;
    }

    return {
      type: "platform",
      title: r.title,
      url: r.url,
      description: r.description,
    } as PlatformLink;
  });
}

const INITIAL_SHOW = 3;

function ReferenceSection({
  references,
  content,
}: {
  references: ChatReference[] | undefined;
  content: string;
}) {
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [showAllWorkers, setShowAllWorkers] = useState(false);
  const normalized = normalizeReferences(references, content);
  const jobs = normalized.filter((r): r is JobReference => r.type === "job");
  const workers = normalized.filter((r): r is WorkerReference => r.type === "worker");
  const platforms = normalized.filter((r): r is PlatformLink => r.type === "platform");

  const visibleJobs = showAllJobs ? jobs : jobs.slice(0, INITIAL_SHOW);
  const visibleWorkers = showAllWorkers ? workers : workers.slice(0, INITIAL_SHOW);

  return (
    <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
      {jobs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            💼 Công việc phù hợp ({jobs.length})
          </p>
          {visibleJobs.map((r, i) => (
            <JobCard key={i} item={r as any} />
          ))}
          {jobs.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllJobs((v) => !v)}
              className="w-full text-[11px] text-blue-500 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
            >
              {showAllJobs ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>Thu gọn</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>Xem thêm {jobs.length - INITIAL_SHOW} công việc</>
              )}
            </button>
          )}
        </div>
      )}

      {workers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            👤 Ứng viên phù hợp ({workers.length})
          </p>
          {visibleWorkers.map((r, i) => (
            <WorkerCard key={i} item={r as any} />
          ))}
          {workers.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllWorkers((v) => !v)}
              className="w-full text-[11px] text-violet-500 hover:text-violet-700 font-medium py-1.5 rounded-lg hover:bg-violet-50 transition-colors flex items-center justify-center gap-1"
            >
              {showAllWorkers ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>Thu gọn</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>Xem thêm {workers.length - INITIAL_SHOW} ứng viên</>
              )}
            </button>
          )}
        </div>
      )}

      {platforms.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            ⚡ Thao tác nhanh
          </p>
          {platforms.map((r, i) => (
            <PlatformActionLink key={i} item={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantMessageBody({
  content,
  references,
}: {
  content: string;
  references?: ChatReference[] | undefined;
}) {
  const normalized = normalizeReferences(references, content);
  const jobs = normalized.filter((r): r is JobReference => r.type === "job");
  const workers = normalized.filter((r): r is WorkerReference => r.type === "worker");
  const hasCards = jobs.length > 0 || workers.length > 0;

  if (hasCards && jobs.length > 0) {
    return (
      <p className="text-sm leading-relaxed text-gray-700">
        Mình tìm thấy <strong>{jobs.length}</strong> công việc phù hợp 👇
      </p>
    );
  }
  if (hasCards && workers.length > 0) {
    return (
      <p className="text-sm leading-relaxed text-gray-700">
        Mình tìm thấy <strong>{workers.length}</strong> ứng viên phù hợp 👇
      </p>
    );
  }

  return <MarkdownText text={content} />;
}

// ─── Main widget ─────────────────────────────────────────────────────────────

export function AiChatWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      getChatSuggestions()
        .then(setSuggestions)
        .catch(() => {});
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setShowPulse(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = text || input.trim();
      if (!msg || isLoading) return;

      setInput("");
      setSuggestions([]);
      
      const userMessage: ChatMessage = { role: "user", content: msg };
      setMessages((prev) => [...prev, userMessage]);
      
      // Add empty assistant message to be filled
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
      setIsLoading(true);

      try {
        const stream = sendChatMessageStream(msg, sessionId);
        let assistantContent = "";
        let finalReferences: ChatReference[] | undefined;

        for await (const chunk of stream) {
          if (chunk.metadata) {
            if (chunk.metadata.sessionId) setSessionId(chunk.metadata.sessionId);
            if (chunk.metadata.references) finalReferences = chunk.metadata.references;
          }
          if (chunk.chunk) {
            assistantContent += chunk.chunk;
            // Update the last message progressively
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1] = {
                role: "assistant",
                content: assistantContent,
                references: finalReferences,
              };
              return newMsgs;
            });
          }
        }
      } catch {
        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = {
            role: "assistant",
            content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
          };
          return newMsgs;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, sessionId]
  );

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="AI Assistant"
        id="ai-chat-toggle"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            {showPulse && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white" />
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[390px] max-h-[580px] bg-white rounded-2xl shadow-2xl shadow-blue-100/50 border border-blue-100 flex flex-col overflow-hidden transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        id="ai-chat-panel"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm">GigWork AI</h3>
            <p className="text-blue-100 text-xs">Trợ lý thông minh</p>
          </div>
          <button
            onClick={() => {
              setMessages([]);
              setSessionId(undefined);
              setSuggestions([]);
            }}
            className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition"
            title="Hội thoại mới"
          >
            Mới
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] bg-gradient-to-b from-blue-50/30 to-white">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 mb-3">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Xin chào! 👋</p>
              <p className="text-xs text-gray-400 mb-4">Tôi có thể giúp gì cho bạn?</p>
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-white border border-blue-100 text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
                    : "bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <AssistantMessageBody content={msg.content} references={msg.references} />
                )}

                {msg.references && msg.references.length > 0 && (
                  <ReferenceSection references={msg.references} content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-[11px] text-gray-400 ml-1">Đang xử lý...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-gray-400"
              disabled={isLoading}
              id="ai-chat-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105"
              id="ai-chat-send"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
