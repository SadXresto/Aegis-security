import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./_core/env";

const serviceClient: SupabaseClient | null =
  !env.supabaseUrl || !env.supabaseServiceRoleKey
    ? null
    : createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    throw new Error(
      "Supabase service-role client is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return serviceClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(serviceClient);
}

/**
 * Validate an access token against Supabase Auth and return the user when
 * it is valid, otherwise null.
 */
export async function getAuthUserFromToken(accessToken: string) {
  if (!accessToken) return null;
  const client = getServiceClient();
  const { data, error } = await client.auth.getUser(accessToken);
  if (error) return null;
  return data.user;
}

/**
 * Resolve the app user (matched by auth uid) with role info. If the profile
 * does not exist yet, create one so the user can sign in immediately.
 */
export async function getOrCreateAppUser(
  uid: string,
  email: string | null,
  fullName: string | null
) {
  const client = getServiceClient();
  const { data: existing, error: selectError } = await client
    .from("users")
    .select("*")
    .eq("id", uid)
    .single();

  if (!selectError && existing) {
    // Sync email/full_name in case the identity changed.
    const payload: Record<string, unknown> = {};
    if (existing.email !== email) payload.email = email;
    if (existing.full_name !== fullName) payload.full_name = fullName;
    if (Object.keys(payload).length > 0) {
      await client
        .from("users")
        .update(payload)
        .eq("id", uid)
        .single();
    }
    return mapUserRow(existing);
  }

  // First sign-in: provision the row. The migration also has a trigger for this,
  // but provisioning here keeps startup idempotent if the trigger is missing.
  const { data: created, error: insertError } = await client
    .from("users")
    .insert({ id: uid, email, full_name: fullName, role: "user" })
    .select()
    .single();

  if (insertError || !created) {
    console.warn("[Supabase] Failed to provision user row:", insertError);
    return null;
  }
  return mapUserRow(created);
}

function mapUserRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    fullName: (row.full_name as string | null) ?? null,
    role: (row.role as string) ?? "user",
    createdAt: (row.created_at as string | null) ?? null,
  };
}

export type AppUser = ReturnType<typeof mapUserRow>;
