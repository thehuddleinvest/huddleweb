import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Lightweight poll target: has the signed-in user's Telegram chat been linked?
// The dashboard's Connect box calls this every few seconds after the user opens
// the deep link, so the UI can flip to "connected" without a manual reload.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  const { data } = await supabase
    .from("users")
    .select("telegram_chat_id")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ connected: !!data?.telegram_chat_id });
}
