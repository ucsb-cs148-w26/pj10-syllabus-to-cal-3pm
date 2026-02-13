import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      // User denied or Google returned an error
      return NextResponse.redirect(new URL(`/?auth_success=false&error=${encodeURIComponent(error)}`, url.origin));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/?auth_success=false&error=missing_code", url.origin));
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      url.origin + "/api/callback",
    );

    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL("/?auth_success=false&error=no_access_token", url.origin),
      );
    }

    // Redirect back to home (Figma app) with token in query params
    return NextResponse.redirect(
      new URL(
        `/?auth_success=true&access_token=${encodeURIComponent(accessToken)}`,
        url.origin,
      ),
    );
  } catch (err) {
    console.error("Google OAuth callback error", err);
    const url = new URL(request.url);
    return NextResponse.redirect(
      new URL("/?auth_success=false&error=callback_error", url.origin),
    );
  }
}
