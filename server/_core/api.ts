import express, { type Express, type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./context";
import {
  getAuthUserFromToken,
  getOrCreateAppUser,
  isSupabaseConfigured,
} from "../supabase.server";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { env } from "./env";
import type { AppRouter } from "../routers";

let trpcRouter: AppRouter | null = null;

export function createApi() {
  const app: Express = express();

  // Parse JSON bodies (needed for tRPC)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ---- JSON error handler for /api/* ----
  // Unexpected errors are returned as JSON so the browser tRPC client gets a
  // parseable response (not an HTML stack trace).
  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    const status = (err && typeof (err as any).statusCode === "number") ? (err as any).statusCode : 500;
    const body = { error: err instanceof Error ? err.message : "Internal Server Error" };
    if (env.isDev) {
      res.status(status).json({ ...body, stack: err instanceof Error ? err.stack : undefined });
    } else {
      res.status(status).json(body);
    }
  });

  // ---- /api/auth/me ----
  app.get("/api/auth/me", async (req, res) => {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: "Supabase is not configured" });
    }
    try {
      const authHeader = req.headers.authorization ?? "";
      const match = /^Bearer\s+(.+)$/i.exec(authHeader);
      const token = match ? match[1] : undefined;

      if (!token) {
        return res.json({ user: null });
      }

      const authUser = await getAuthUserFromToken(token);
      if (!authUser) {
        return res.status(401).json({ error: UNAUTHED_ERR_MSG });
      }

      const appUser = await getOrCreateAppUser(
        authUser.id,
        authUser.email ?? null,
        authUser.user_metadata?.full_name ?? null
      );
      return res.json({ user: appUser ?? null });
    } catch (err) {
      console.error("[/api/auth/me]", err);
      return res.status(500).json({ error: "Failed to load session" });
    }
  });

  // ---- /api/auth/logout ----
  app.post("/api/auth/logout", async (req, res) => {
    // Clear the Supabase session cookie and return success.
    res.clearCookie("sb-instance", { path: "/" });
    return res.json({ success: true });
  });

  // ---- tRPC ----
  if (trpcRouter) {
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: trpcRouter,
        createContext: opts => createContext({ authorizationHeader: opts.req.headers.authorization }),
      })
    );
  }

  // ---- SPA fallback (mounted after /api/* routes) ----
  // This is mounted by server/index.ts after static files; kept here for
  // convenience but the actual static+SPA mounting happens in index.ts.
  return app;
}

export function setTrpcRouter(router: AppRouter) {
  trpcRouter = router;
}
