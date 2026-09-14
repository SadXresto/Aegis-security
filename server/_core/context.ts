import type { AppUser } from "../supabase.server";
import {
  getAuthUserFromToken,
  getOrCreateAppUser,
  isSupabaseConfigured,
} from "../supabase.server";

export type TrpcContext = {
  user: AppUser | null;
};

export async function createContext(opts: {
  authorizationHeader?: string | null;
}): Promise<TrpcContext> {
  let user: AppUser | null = null;

  try {
    const authHeader = opts.authorizationHeader ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(authHeader);
    const token = match ? match[1] : undefined;

    if (token && isSupabaseConfigured()) {
      const authUser = await getAuthUserFromToken(token);
      if (authUser) {
        user = await getOrCreateAppUser(
          authUser.id,
          authUser.email ?? null,
          authUser.user_metadata?.full_name ?? null
        );
      }
    }
  } catch (error) {
    console.warn("[Auth] Could not resolve request user:", error);
    user = null;
  }

  return { user };
}
