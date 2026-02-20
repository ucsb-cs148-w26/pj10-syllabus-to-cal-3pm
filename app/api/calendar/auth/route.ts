import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export async function GET(request: NextRequest) {
  try {
    const prompt = new URL(request.url).searchParams.get("prompt") ?? undefined;

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: prompt ?? "consent",
    });

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error: unknown) {
    console.error("Error generating auth URL:", error);
    const message = error instanceof Error ? error.message : "Failed to generate authorization URL";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
