import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.NEXT_SUPABASE_URL;
const supabaseKey = import.meta.env.NEXT_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export async function ensureAnonymousSession() {
  if (!supabase) throw new Error("Thiếu cấu hình Supabase");
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session) throw new Error("Không thể tạo phiên cá nhân");
  return data.session;
}
