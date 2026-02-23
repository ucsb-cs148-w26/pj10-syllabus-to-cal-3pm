import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const GOOGLE_CALENDAR_ACCESS_COOKIE = "google_calendar_access_token";
export const GOOGLE_CALENDAR_OAUTH_STATE_COOKIE = "google_calendar_oauth_state";

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function trimToken(token?: string | null): string | null {
  if (!token) return null;
  const value = token.trim();
  return value.length > 0 ? value : null;
}

export function getCalendarAccessToken(request: NextRequest): string | null {
  return trimToken(request.cookies.get(GOOGLE_CALENDAR_ACCESS_COOKIE)?.value ?? null);
}

export function setCalendarAccessTokenCookie(
  response: NextResponse,
  token: string,
  maxAgeSeconds?: number
): void {
  response.cookies.set({
    name: GOOGLE_CALENDAR_ACCESS_COOKIE,
    value: token,
    ...COOKIE_OPTIONS,
    ...(maxAgeSeconds && maxAgeSeconds > 0 ? { maxAge: maxAgeSeconds } : {}),
  });
}

export function clearCalendarAccessTokenCookie(response: NextResponse): void {
  response.cookies.set({
    name: GOOGLE_CALENDAR_ACCESS_COOKIE,
    value: "",
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export function createCalendarOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function getCalendarOAuthState(request: NextRequest): string | null {
  return trimToken(request.cookies.get(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE)?.value ?? null);
}

export function setCalendarOAuthStateCookie(
  response: NextResponse,
  state: string,
  maxAgeSeconds = 10 * 60
): void {
  response.cookies.set({
    name: GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
    value: state,
    ...COOKIE_OPTIONS,
    maxAge: maxAgeSeconds,
  });
}

export function clearCalendarOAuthStateCookie(response: NextResponse): void {
  response.cookies.set({
    name: GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
    value: "",
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}

function toOrigin(urlLike: string | null): string | null {
  if (!urlLike) return null;
  try {
    return new URL(urlLike).origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const expectedOrigin = new URL(request.url).origin;

  const origin = request.headers.get("origin");
  if (origin) return origin === expectedOrigin;

  const refererOrigin = toOrigin(request.headers.get("referer"));
  if (refererOrigin) return refererOrigin === expectedOrigin;

  return false;
}

export function requireSameOrigin(request: NextRequest): NextResponse | null {
  if (isSameOriginRequest(request)) return null;
  return NextResponse.json(
    { success: false, error: "Invalid request origin" },
    { status: 403 }
  );
}
