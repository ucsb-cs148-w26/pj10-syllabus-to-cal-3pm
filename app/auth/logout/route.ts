import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearCalendarAccessTokenCookie } from "@/lib/calendarAuth";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  clearCalendarAccessTokenCookie(response);
  return response;
}
