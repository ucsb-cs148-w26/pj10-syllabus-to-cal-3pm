import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey } from "@/lib/utils";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey!,
  );
}
