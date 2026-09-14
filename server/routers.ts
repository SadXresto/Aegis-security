import { router, publicProcedure, protectedProcedure } from "./trpc";
import type { AppUser } from "./supabase.server";

export const authRouter = router({
  me: publicProcedure.query(async (opts) => {
    return opts.ctx.user;
  }),
  logout: protectedProcedure.mutation(async (opts) => {
    // The Express side clears the cookie; here we just acknowledge.
    return { success: true };
  }),
});

const healthRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
});

export const appRouter = router({
  auth: authRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
