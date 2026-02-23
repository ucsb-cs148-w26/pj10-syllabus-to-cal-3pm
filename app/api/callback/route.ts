import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import {
  clearCalendarAccessTokenCookie,
  clearCalendarOAuthStateCookie,
  getCalendarOAuthState,
  setCalendarAccessTokenCookie,
} from "@/lib/calendarAuth";

const SAFE_OAUTH_ERROR_CODES = new Set([
  "access_denied",
  "invalid_request",
  "invalid_scope",
  "server_error",
  "temporarily_unavailable",
  "invalid_state",
]);

function redirectWithError(url: URL, code: string) {
  const response = NextResponse.redirect(
    new URL(`/protected?auth_success=false&error=${code}`, url.origin),
  );
  clearCalendarAccessTokenCookie(response);
  clearCalendarOAuthStateCookie(response);
  return response;
}

function normalizeOAuthError(raw: string | null): string {
  if (!raw) return "oauth_error";
  const value = raw.trim().toLowerCase();
  return SAFE_OAUTH_ERROR_CODES.has(value) ? value : "oauth_error";
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state");
    const expectedState = getCalendarOAuthState(request);

    if (!state || !expectedState || state !== expectedState) {
      return redirectWithError(url, "invalid_state");
    }

    if (error) {
      return redirectWithError(url, normalizeOAuthError(error));
    }

    if (!code) {
      return redirectWithError(url, "missing_code");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      url.origin + "/api/callback",
    );

    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return redirectWithError(url, "no_access_token");
    }

    const response = NextResponse.redirect(new URL("/protected?auth_success=true", url.origin));
    const maxAgeSeconds =
      typeof tokens.expiry_date === "number"
        ? Math.max(60, Math.floor((tokens.expiry_date - Date.now()) / 1000))
        : undefined;
    setCalendarAccessTokenCookie(response, accessToken, maxAgeSeconds);
    clearCalendarOAuthStateCookie(response);
    return response;
  } catch (err) {
    console.error("Google OAuth callback error", err);
    const url = new URL(request.url);
    return redirectWithError(url, "callback_error");
  }
}
