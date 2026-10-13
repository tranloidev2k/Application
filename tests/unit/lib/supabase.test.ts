import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = {
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth })),
}));

const load = () => import("../../../src/lib/supabase");

describe("supabase client", () => {
  beforeEach(() => {
    vi.resetModules();
    auth.getSession.mockReset();
    auth.signInAnonymously.mockReset();
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("explains missing configuration", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    const { getSupabase, supabase } = await load();
    expect(supabase).toBeNull();
    expect(getSupabase).toThrow("Supabase is not configured");
  });

  it("reuses an existing session", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: {} } },
      error: null,
    });
    const { ensureSession } = await load();
    await ensureSession();
    await ensureSession();
    expect(auth.getSession).toHaveBeenCalledTimes(1);
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("signs in anonymously when there is no session", async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInAnonymously.mockResolvedValue({ error: null });
    const { ensureSession } = await load();
    await ensureSession();
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it("retries after a failed sign in", async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInAnonymously
      .mockResolvedValueOnce({
        error: new Error("Anonymous sign-ins are disabled"),
      })
      .mockResolvedValueOnce({ error: null });
    const { ensureSession } = await load();
    await expect(ensureSession()).rejects.toThrow("Anonymous sign-ins");
    await expect(ensureSession()).resolves.toBeUndefined();
  });

  it("surfaces session lookup errors", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error("bad token"),
    });
    const { ensureSession } = await load();
    await expect(ensureSession()).rejects.toThrow("bad token");
  });
});
