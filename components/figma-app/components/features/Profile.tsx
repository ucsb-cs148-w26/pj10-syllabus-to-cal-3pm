"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "../ui/card";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition";

export interface ProfileProps {
  accessToken: string | null;
  onGoToUploads?: () => void;
}

export function Profile(_props: ProfileProps) {
  const supabase = createClient();

  // User data
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Email change states
  const [newEmail, setNewEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Load user data
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email ?? "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setEmailSubmitting(true);
    setEmailError("");
    setEmailSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (error) throw error;

      setEmail(newEmail.trim());
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to update email"
      );
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordSubmitting(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError("Current password is incorrect");
        setPasswordSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="max-w-[1120px] mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-0.5">Settings</h2>
          <p className="text-xs text-gray-500">Manage your account information.</p>
        </div>

        <div className="space-y-6">
          {/* Email */}
          <Card className="border-gray-200/80 bg-white/80 backdrop-blur shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Change Email</h3>
                {emailSuccess && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <Check className="w-3.5 h-3.5" /> Email updated
                  </span>
                )}
              </div>

              <form onSubmit={handleUpdateEmail} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-email" className="text-xs font-medium text-gray-600">
                    New Email
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                {emailError && (
                  <div className="flex items-center gap-2 text-xs text-rose-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {emailError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">{email}</p>
                  <button
                    type="submit"
                    disabled={emailSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
                  >
                    {emailSubmitting ? "Updating…" : "Update Email"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="border-gray-200/80 bg-white/80 backdrop-blur shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
                {passwordSuccess && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <Check className="w-3.5 h-3.5" /> Password updated
                  </span>
                )}
              </div>

              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="current-password" className="text-xs font-medium text-gray-600">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-password" className="text-xs font-medium text-gray-600">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm-password" className="text-xs font-medium text-gray-600">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-xs text-rose-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {passwordError}
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={passwordSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
                  >
                    {passwordSubmitting ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Deletion */}
          <Card className="border-gray-200/80 bg-white/80 backdrop-blur shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Account Deletion</h3>
              <p className="text-xs text-slate-600">
                To delete your account, contact us at {"hopebringapples@gmail.com"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
