import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FigmaApp from "@/components/figma-app/FigmaApp";

export default async function ProtectedGate() {
  const supabase = await createClient();

  // This is the line causing the warning when not under Suspense
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return <FigmaApp />;
}
