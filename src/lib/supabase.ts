import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return supabase;
}

let pendingSession: Promise<void> | null = null;

// Each browser gets its own anonymous Supabase user; row level security
// limits every query to that user's events.
export function ensureSession() {
  pendingSession ??= (async () => {
    const auth = getSupabase().auth;
    const { data, error } = await auth.getSession();
    if (error) throw error;
    if (data.session) return;
    const signIn = await auth.signInAnonymously();
    if (signIn.error) throw signIn.error;
  })().catch((error: unknown) => {
    pendingSession = null;
    throw error;
  });
  return pendingSession;
}
