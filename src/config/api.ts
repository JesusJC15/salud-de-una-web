// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  endpoints: {
    auth: {
      login: "/auth/staff/login",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
      me: "/auth/me",
    },
  },
  timeout: 10000,
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};
