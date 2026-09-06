import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("accepts the configured project URL and browser-safe key", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    const browserUrl = process.env.VITE_SUPABASE_URL;
    const browserKey = process.env.VITE_SUPABASE_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();
    expect(browserUrl).toBe(url);
    expect(browserKey).toBe(key);

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key as string },
    });

    expect(response.ok).toBe(true);
  }, 15_000);
});
