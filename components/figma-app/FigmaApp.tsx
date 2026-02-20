"use client";

import { useEffect, useState } from "react";
import { Landing } from "@/components/figma-app/components/features/Landing";
import { Uploads } from "@/components/figma-app/components/features/Uploads";
import { Calendar } from "@/components/figma-app/components/features/Calendar";
import { StudyPlan } from "@/components/figma-app/components/features/StudyPlan";
import { Profile } from "@/components/figma-app/components/features/Profile";

const GOOGLE_TOKEN_KEY = "syllabus_calendar_google_token";

type View = "landing" | "uploads" | "calendar" | "study-plan" | "profile";

function getInitialToken(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  if (url.searchParams.get("auth_success") === "true") {
    const t = url.searchParams.get("access_token");
    if (t) return t;
  }
  return sessionStorage.getItem(GOOGLE_TOKEN_KEY);
}

export default function FigmaApp() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [accessToken, setAccessTokenState] = useState<string | null>(getInitialToken);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    if (typeof window !== "undefined") {
      if (token) sessionStorage.setItem(GOOGLE_TOKEN_KEY, token);
      else sessionStorage.removeItem(GOOGLE_TOKEN_KEY);
    }
  };

  // On OAuth return: clean URL and go to uploads; token already in state from getInitialToken
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const authSuccess = url.searchParams.get("auth_success");
    const tokenFromUrl = url.searchParams.get("access_token");
    if (authSuccess === "true" && tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      url.searchParams.delete("auth_success");
      url.searchParams.delete("access_token");
      window.history.replaceState({}, "", url.toString());
      setCurrentView("uploads");
    } else {
      const stored = sessionStorage.getItem(GOOGLE_TOKEN_KEY);
      if (stored) setAccessTokenState(stored);
    }
  }, []);

  if (currentView === "landing") {
    return <Landing onGetStarted={() => setCurrentView("uploads")} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SC</span>
              </div>
              <h1 className="font-semibold text-gray-900">Syllabus Calendar</h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView("uploads")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === "uploads"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Uploads
              </button>

              <button
                onClick={() => setCurrentView("calendar")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === "calendar"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Calendar
              </button>

              <button
                onClick={() => setCurrentView("study-plan")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === "study-plan"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Study Plan
              </button>

              <button
                onClick={() => setCurrentView("profile")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === "profile"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === "uploads" && (
          <Uploads
            initialAccessToken={accessToken}
            onAccessTokenChange={setAccessToken}
          />
        )}
        {currentView === "calendar" && (
          <Calendar
            accessToken={accessToken}
            onGoToUploads={() => setCurrentView("uploads")}
          />
        )}
        {currentView === "study-plan" && <StudyPlan />}
        {currentView === "profile" && <Profile />}
      </main>
    </div>
  );
}
