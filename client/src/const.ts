// Auth navigation helpers.
// These are kept minimal — the AuthContext handles the Supabase client directly.

export const AUTH_PATHS = {
  signIn: "/auth",
  account: "/account",
  home: "/",
} as const;
