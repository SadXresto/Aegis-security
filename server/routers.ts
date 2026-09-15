import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getServiceClient } from "./supabase.server";
import { router, publicProcedure, protectedProcedure } from "./trpc";

const severitySchema = z.enum(["critical", "high", "medium", "low"]);
const statusSchema = z.enum(["open", "in_progress", "resolved"]);
const idSchema = z.string().min(1, "A record id is required.");

/** Small helper so every write stays scoped to the authenticated user. */
function fail(message: string): never {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
}

export const authRouter = router({
  me: publicProcedure.query(async (opts) => {
    return opts.ctx.user;
  }),
  logout: protectedProcedure.mutation(async () => {
    // The Express side clears the cookie; here we just acknowledge.
    return { success: true };
  }),
});

/* ------------------------------------------------------------------ *
 * Reports
 * ------------------------------------------------------------------ */

export const reportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await getServiceClient()
      .from("reports")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return data ?? [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.string().trim().min(1, "A report type is required."),
        severity: severitySchema.default("low"),
        status: statusSchema.default("open"),
        description: z.string().max(2000).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await getServiceClient()
        .from("reports")
        .insert({
          user_id: ctx.user.id,
          type: input.type,
          severity: input.severity,
          status: input.status,
          description: input.description ?? null,
        })
        .select()
        .single();
      if (error) fail(error.message);
      return data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: idSchema,
        type: z.string().trim().min(1).optional(),
        severity: severitySchema.optional(),
        status: statusSchema.optional(),
        description: z.string().max(2000).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const payload = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined)
      );
      if (Object.keys(payload).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nothing to update." });
      }
      const { data, error } = await getServiceClient()
        .from("reports")
        .update(payload)
        .eq("id", id)
        .eq("user_id", ctx.user.id)
        .select()
        .maybeSingle();
      if (error) fail(error.message);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      return data;
    }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const { error } = await getServiceClient()
      .from("reports")
      .delete()
      .eq("id", input.id)
      .eq("user_id", ctx.user.id);
    if (error) fail(error.message);
    return { success: true };
  }),
});

/* ------------------------------------------------------------------ *
 * Threats
 * ------------------------------------------------------------------ */

export const threatsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await getServiceClient()
      .from("threats")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return data ?? [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        severity: severitySchema.default("low"),
        source: z.string().trim().min(1, "A signal source is required."),
        description: z.string().max(2000).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await getServiceClient()
        .from("threats")
        .insert({
          user_id: ctx.user.id,
          severity: input.severity,
          source: input.source,
          description: input.description ?? null,
        })
        .select()
        .single();
      if (error) fail(error.message);
      return data;
    }),
});

/* ------------------------------------------------------------------ *
 * Vault
 * Important: `passwordEncrypted` must already be encrypted in the browser
 * (AES-256-GCM). The server stores the opaque ciphertext and never sees the
 * plaintext password.
 * ------------------------------------------------------------------ */

export const vaultRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await getServiceClient()
      .from("vault_items")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("updated_at", { ascending: false });
    if (error) fail(error.message);
    return data ?? [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        site: z.string().trim().min(1, "A site is required."),
        username: z.string().trim().max(160).nullish(),
        passwordEncrypted: z.string().min(1, "Encrypted password payload is required."),
        strength: z.enum(["weak", "fair", "good", "strong"]).default("weak"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await getServiceClient()
        .from("vault_items")
        .insert({
          user_id: ctx.user.id,
          site: input.site,
          username: input.username ?? null,
          password_encrypted: input.passwordEncrypted,
          strength: input.strength,
        })
        .select()
        .single();
      if (error) fail(error.message);
      return data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: idSchema,
        site: z.string().trim().min(1).optional(),
        username: z.string().trim().max(160).nullish(),
        passwordEncrypted: z.string().min(1).optional(),
        strength: z.enum(["weak", "fair", "good", "strong"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, passwordEncrypted, ...rest } = input;
      const payload = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined)
      );
      if (passwordEncrypted !== undefined) payload.password_encrypted = passwordEncrypted;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await getServiceClient()
        .from("vault_items")
        .update(payload)
        .eq("id", id)
        .eq("user_id", ctx.user.id)
        .select()
        .maybeSingle();
      if (error) fail(error.message);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Vault entry not found." });
      return data;
    }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const { error } = await getServiceClient()
      .from("vault_items")
      .delete()
      .eq("id", input.id)
      .eq("user_id", ctx.user.id);
    if (error) fail(error.message);
    return { success: true };
  }),
});

const healthRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
});

export const appRouter = router({
  auth: authRouter,
  reports: reportsRouter,
  threats: threatsRouter,
  vault: vaultRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
