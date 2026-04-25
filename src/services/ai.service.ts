import { apiClient } from "@/lib/api-client";

// ─── Types ───

export interface JobReference {
  type: "job";
  title: string;
  url: string;
  salary?: string;
  location?: string;
  category?: string;
}

export interface WorkerReference {
  type: "worker";
  title: string;
  url: string;
  price?: string;
  location?: string;
  isAvailable?: boolean;
}

export interface PlatformLink {
  type: "platform";
  title: string;
  url: string;
  description?: string;
}

export type ChatReference = JobReference | WorkerReference | PlatformLink;

export interface ChatResponse {
  message: string;
  sessionId: string;
  sources?: string[];
  references?: ChatReference[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string; timestamp: string }[];
  createdAt: string;
}

export interface ScamAnalysisResult {
  scamScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  reasons: string[];
  recommendation: string;
  matchedPatterns: string[];
  aiAnalysis: string;
}

// ─── AI Chat ───

export async function sendChatMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  return apiClient.post<ChatResponse>("/ai/chat", { message, sessionId });
}

export async function* sendChatMessageStream(
  message: string,
  sessionId?: string
): AsyncGenerator<{ chunk?: string; metadata?: any; isDone?: boolean }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  
  const response = await fetch(`${baseUrl}/ai/chat-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Failed to start stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      
      // Keep the last partial line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") {
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            yield parsed;
          } catch (e) {
            console.error("Failed to parse stream chunk:", dataStr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getChatSuggestions(): Promise<string[]> {
  return apiClient.get<string[]>("/ai/chat/suggestions");
}

export async function getChatHistory(
  page = 1,
  limit = 10
): Promise<{ data: ChatSession[]; total: number }> {
  return apiClient.get(`/ai/chat/history?page=${page}&limit=${limit}`);
}

// ─── Scam Detection ───

export async function analyzeJob(jobId: string): Promise<ScamAnalysisResult> {
  return apiClient.post<ScamAnalysisResult>("/ai/analyze-job", { jobId });
}

export async function analyzeJobContent(data: {
  title: string;
  description: string;
  companyName?: string;
  salary?: number;
  address?: string;
}): Promise<ScamAnalysisResult> {
  return apiClient.post<ScamAnalysisResult>("/ai/analyze-job-content", data);
}

// ─── Saved Jobs ───

export async function saveJob(jobId: string): Promise<{ saved: boolean }> {
  return apiClient.post(`/ai/saved-jobs/${jobId}`);
}

export async function unsaveJob(jobId: string): Promise<{ saved: boolean }> {
  return apiClient.delete(`/ai/saved-jobs/${jobId}`);
}

export async function getSavedJobs(page = 1, limit = 10) {
  return apiClient.get(`/ai/saved-jobs?page=${page}&limit=${limit}`);
}

export async function checkJobSaved(
  jobId: string
): Promise<{ saved: boolean }> {
  return apiClient.get(`/ai/saved-jobs/check/${jobId}`);
}

// ─── Admin Sync ───

export async function syncJobsToVectorDb() {
  return apiClient.postFull("/ai/dev-sync");
}
