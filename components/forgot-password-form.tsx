"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-200/80 p-8">
          <h2 className="text-xl font-semibold text-gray-900">Check Your Email</h2>
          <p className="text-sm text-gray-500 mt-1">Password reset instructions sent</p>
          <p className="text-sm text-gray-600 mt-4">
            If you registered using your email and password, you will receive a password reset email.
          </p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-200/80 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Reset Your Password</h2>
            <p className="text-sm text-gray-500 mt-1">
              Write your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-gray-600">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
              >
                {isLoading ? "Sending…" : "Send reset email"}
              </button>
            </div>
            <div className="mt-5 text-center text-xs text-gray-500">
              Return to {" "}
              <Link href="/auth/login" className="text-indigo-700 hover:text-indigo-900 underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
