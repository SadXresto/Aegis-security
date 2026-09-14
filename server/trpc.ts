import { initTRPC, TRPCError } from "@trpc/server";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import superjson from "superjson";
import type { AppUser } from "./supabase.server";

export type TrpcContext = {
  user: AppUser | null;
};

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;

const requireUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

// System health router (kept so trpc:null usage can scan without a type error)
export const systemRouter = t.router({
  health: t.procedure.query(() => ({ ok: true })),
});

export const createRouter = () => t.router({
  system: systemRouter,
});
