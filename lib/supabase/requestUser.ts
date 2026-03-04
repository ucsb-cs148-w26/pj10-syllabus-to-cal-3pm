import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { hasEnvVars, supabaseKey } from "@/lib/utils";

export function toUserScope(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function getRequestUserId(request: NextRequest): Promise<string | null> {
  if (!hasEnvVars || !process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
    return null;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Route handlers in this app don't mutate auth cookies directly.
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}
