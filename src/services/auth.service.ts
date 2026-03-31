import apiClient from "@/lib/api-client";
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types";

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<void> {
    await apiClient.postFull("/auth/register", data);
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/login", data);
    apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/refresh", data);
    apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.postFull("/auth/logout", { refreshToken });
    apiClient.clearTokens();
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.getFull(`/auth/verify-email?token=${token}`);
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.postFull("/auth/forgot-password", data);
  },

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.postFull("/auth/reset-password", data);
  },

  /**
   * Login with Google ID token (from popup/One Tap)
   */
  async loginWithGoogleIdToken(idToken: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      "/auth/google/id-token",
      { idToken },
    );
    apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  },
};

export default authService;
