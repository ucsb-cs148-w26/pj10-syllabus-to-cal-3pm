"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  const signIn = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/figma`,
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
      alert(error.message);
    }
  };

  return (
    <button
      onClick={signIn}
      className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
    >
      Continue with Google
    </button>
  );
}
