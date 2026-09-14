import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let svc: SupabaseClient | null = null;

    try {
      svc = createSupabaseClient();
      setClient(svc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Supabase not configured");
      setLoading(false);
      return;
    }

    let mounted = true;

    const refresh = async () => {
      try {
        const { data } = await svc!.auth.getUser();
        if (active && mounted) {
          setUser(data.user ? (data.user as unknown as Record<string, unknown>) : null);
          setError(null);
        }
      } catch (err) {
        if (active && mounted) {
          setError(err instanceof Error ? err.message : "Session check failed");
        }
      }
    };

    refresh();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: listener } = svc!.auth.onAuthStateChange(
      (_event: unknown, session: { user: User | null } | null) => {
        if (active && mounted) {
          setUser(session?.user ? (session.user as unknown as Record<string, unknown>) : null);
          setError(null);
        }
      }
    );

    return () => {
      active = false;
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error("Auth client not ready");
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    },
    [client]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error("Auth client not ready");
      const { error: signUpError } = await client.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
    },
    [client]
  );

  const signOut = useCallback(async () => {
    if (!client) return;
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
  }, [client]);

  const refresh = useCallback(async () => {
    if (!client) return;
    const { data } = await client.auth.getUser();
    setUser(data.user ? (data.user as unknown as Record<string, unknown>) : null);
  }, [client]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: Boolean(user),
        signIn,
        signUp,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Redirects unauthenticated users to /auth if they are not already there. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated && typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
