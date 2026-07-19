import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Generate a one-time deep link the user opens in Telegram to connect their
// chat to their account.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const token = randomBytes(24).toString("hex");
  const admin = createAdminClient();
  const { error } = await admin.from("telegram_link_tokens").insert({
    token,
    user_id: user.id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "thehuddleinvestbot";
  const url = `https://t.me/${botUsername}?start=${token}`;
  return NextResponse.json({ url });
}
