const API_BASE = "/api";

export const authApi = {
  me: {
    async invalidate() {
      await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
    },
  },
};
