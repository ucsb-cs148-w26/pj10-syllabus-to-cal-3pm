import { NextRequest } from "next/server";

jest.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: jest.fn(() => ({ getToken: jest.fn() })),
    },
  },
}));

import { GET } from "@/app/api/callback/route";
import { google } from "googleapis";

describe("OAuth callback security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects callback when state does not match cookie (invalid_state)", async () => {
    const req = new NextRequest(
      "http://localhost/api/callback?code=test-code&state=attacker-state",
      {
        headers: {
          cookie: "google_calendar_oauth_state=expected-state",
        },
      }
    );

    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/protected?auth_success=false&error=invalid_state"
    );
    expect(res.cookies.get("google_calendar_access_token")?.maxAge).toBe(0);
    expect(res.cookies.get("google_calendar_oauth_state")?.maxAge).toBe(0);
    const mockOAuth2 = google.auth.OAuth2 as jest.Mock;
    expect(mockOAuth2).not.toHaveBeenCalled();
  });
});
