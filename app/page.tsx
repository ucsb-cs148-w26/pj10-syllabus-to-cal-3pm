import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Landing } from "@/components/figma-app/components/features/Landing";
import { hasEnvVars } from "@/lib/utils";

export default async function Home() {
  if (!hasEnvVars) {
    return <Landing />;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/protected");
  }

  return <Landing />;
}
