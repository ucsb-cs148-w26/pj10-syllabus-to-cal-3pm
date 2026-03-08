"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton({ children, ...props }: ButtonProps) {
  const router = useRouter();

  const logout = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/auth/logout", { method: "POST" }).catch(() => {});
    } catch {
      // ignore
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <Button onClick={logout} {...props}>
      {children ?? "Logout"}
    </Button>
  );
}
