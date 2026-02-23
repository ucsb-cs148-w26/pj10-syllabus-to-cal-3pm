import { NextRequest, NextResponse } from "next/server";
import { getCalendarAccessToken } from "@/lib/calendarAuth";

export async function GET(request: NextRequest) {
  const token = getCalendarAccessToken(request);
  return NextResponse.json({ connected: !!token });
}
