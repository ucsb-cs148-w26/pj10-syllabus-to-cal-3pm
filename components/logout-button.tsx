"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton({ children, ...props }: ButtonProps) {
  const router = useRouter();

  const logout = async () => {
    try {
      const res = await fetch("/auth/logout", { method: "POST" });
      if (!res.ok) {
        throw new Error("Logout failed");
      }
    } catch {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/");
    }
  };

  return (
    <Button onClick={logout} {...props}>
      {children ?? "Logout"}
    </Button>
  );
}
