import { ApiError, ApiSuccessResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestConfig {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: unknown;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

import { translateErrorMessage } from "./translations";

/**
 * Utility function to get error message from ApiError
 */
export function getErrorMessage(error: ApiError): string {
  if (Array.isArray(error.message)) {
    return error.message.map(translateErrorMessage).join(", ");
  }
  return translateErrorMessage(error.message || "");
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as { success: boolean }).success === false
  );
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const result: ApiSuccessResponse<{
        accessToken: string;
        refreshToken: string;
      }> = await response.json();

      if (result.success && result.data) {
        this.setTokens(result.data.accessToken, result.data.refreshToken);
        return result.data.accessToken;
      }

      this.clearTokens();
      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  /**
   * Main request method - returns unwrapped data from ApiSuccessResponse
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = "GET", body, cache, next, headers = {} } = config;

    const accessToken = this.getAccessToken();

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (accessToken) {
      requestHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache,
      next,
    });

    // Handle 401 - Try to refresh token
    if (response.status === 401 && accessToken) {
      const newAccessToken = await this.refreshAccessToken();
      if (newAccessToken) {
        requestHeaders["Authorization"] = `Bearer ${newAccessToken}`;
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          cache,
          next,
        });
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        success: false as const,
        statusCode: response.status,
        errorCode: "SYSTEM_UNKNOWN_ERROR",
        message: "An error occurred",
        timestamp: new Date().toISOString(),
      }));
      throw errorData;
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T;
    }

    // Parse response and unwrap data
    const result: ApiSuccessResponse<T> = await response.json();

    // Return unwrapped data for convenience
    return result.data;
  }

  /**
   * Request method that returns full ApiSuccessResponse (useful when you need message or meta)
   */
  async requestFull<T>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiSuccessResponse<T>> {
    const { method = "GET", body, cache, next, headers = {} } = config;

    const accessToken = this.getAccessToken();

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (accessToken) {
      requestHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache,
      next,
    });

    // Handle 401 - Try to refresh token
    if (response.status === 401 && accessToken) {
      const newAccessToken = await this.refreshAccessToken();
      if (newAccessToken) {
        requestHeaders["Authorization"] = `Bearer ${newAccessToken}`;
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          cache,
          next,
        });
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        success: false as const,
        statusCode: response.status,
        errorCode: "SYSTEM_UNKNOWN_ERROR",
        message: "An error occurred",
        timestamp: new Date().toISOString(),
      }));
      throw errorData;
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {
        success: true,
        statusCode: response.status,
        data: {} as T,
        timestamp: new Date().toISOString(),
      };
    }

    return response.json();
  }

  // Convenience methods
  get<T>(endpoint: string, config?: Omit<RequestConfig, "method" | "body">) {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  post<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...config, method: "POST", body });
  }

  put<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...config, method: "PUT", body });
  }

  patch<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...config, method: "PATCH", body });
  }

  delete<T>(endpoint: string, config?: Omit<RequestConfig, "method" | "body">) {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  // Full response methods (when you need message or meta)
  getFull<T>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">,
  ) {
    return this.requestFull<T>(endpoint, { ...config, method: "GET" });
  }

  postFull<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">,
  ) {
    return this.requestFull<T>(endpoint, { ...config, method: "POST", body });
  }

  patchFull<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">,
  ) {
    return this.requestFull<T>(endpoint, { ...config, method: "PATCH", body });
  }

  deleteFull<T>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">,
  ) {
    return this.requestFull<T>(endpoint, { ...config, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_URL || "");
export default apiClient;
