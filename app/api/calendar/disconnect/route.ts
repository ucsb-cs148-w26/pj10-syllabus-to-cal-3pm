import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { clearCalendarAccessTokenCookie, requireSameOrigin } from "@/lib/calendarAuth";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const response = NextResponse.json({ success: true });
  clearCalendarAccessTokenCookie(response);
  return response;
}
