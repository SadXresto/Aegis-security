import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { AppUser } from "./supabase.server";

describe("auth.logout", () => {
  it("returns success for an authenticated user", async () => {
    const user: AppUser = {
      id: "00000000-0000-0000-0000-000000000000",
      email: "sample@example.com",
      fullName: "Sample User",
      role: "user",
      createdAt: new Date().toISOString(),
    };

    const ctx: TrpcContext = { user };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });

  it("rejects unauthenticated logout attempts", async () => {
    const ctx: TrpcContext = { user: null };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.logout()).rejects.toThrow();
  });
});
