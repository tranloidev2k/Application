import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

const missingSupabaseConfig =
  "Thiếu cấu hình Supabase: cần NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

async function getOrCreateSession() {
  if (!supabase) throw new Error(missingSupabaseConfig);
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session) throw new Error("Không thể tạo phiên cá nhân");
  return data.session;
}

let pendingSession: ReturnType<typeof getOrCreateSession> | null = null;

// Shares one in-flight request so parallel callers do not create two
// anonymous users on the first visit.
export function ensureAnonymousSession() {
  pendingSession ??= getOrCreateSession().finally(() => {
    pendingSession = null;
  });
  return pendingSession;
}
