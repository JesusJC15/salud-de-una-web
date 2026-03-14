import { API_CONFIG, getApiUrl } from "@/config/api";
import { LoginRequest, AuthResponse, AuthMeResponse, ApiErrorResponse } from "@/types/auth";

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Cargar tokens del localStorage si existen
    if (globalThis.window !== undefined) {
      this.accessToken = localStorage.getItem("accessToken");
      this.refreshToken = localStorage.getItem("refreshToken");
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const endpoint = API_CONFIG.endpoints.auth.login;
    const response = await fetch(getApiUrl(endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error: ApiErrorResponse = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data: AuthResponse = await response.json();

    // Guardar tokens
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;

    if (globalThis.window !== undefined) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(getApiUrl(API_CONFIG.endpoints.auth.logout), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Limpiar tokens sin importar si la solicitud fue exitosa
      this.accessToken = null;
      this.refreshToken = null;

      if (globalThis.window !== undefined) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    }
  }

  async getMe(): Promise<AuthMeResponse> {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    const response = await fetch(getApiUrl(API_CONFIG.endpoints.auth.me), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user info");
    }

    return await response.json();
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const authService = new AuthService();
