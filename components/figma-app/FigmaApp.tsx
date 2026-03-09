"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Uploads } from "@/components/figma-app/components/features/Uploads";
import { Calendar } from "@/components/figma-app/components/features/Calendar";
import { StudyPlan } from "@/components/figma-app/components/features/StudyPlan";
import { Profile } from "@/components/figma-app/components/features/Profile";
import { LogoutButton } from "@/components/logout-button";

const GOOGLE_CONNECTED_MARKER = "google-calendar-session";

type View = "uploads" | "calendar" | "study-plan" | "profile";

export default function FigmaApp() {
  const [currentView, setCurrentView] = useState<View>("uploads");
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [calendarVersion, setCalendarVersion] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const navContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token ? GOOGLE_CONNECTED_MARKER : null);
  };

  const syncCalendarConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/session", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setAccessTokenState(data?.connected ? GOOGLE_CONNECTED_MARKER : null);
    } catch {
      setAccessTokenState(null);
    }
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data?.user);
    });
  }, []);

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setCurrentView("profile");
  };

  // On OAuth return: clean URL and refresh server-backed calendar session state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const authSuccess = url.searchParams.get("auth_success");
    const hasError = url.searchParams.has("error");
    if (authSuccess !== null) {
      url.searchParams.delete("auth_success");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
      if (authSuccess === "true") {
        setCurrentView("uploads");
        setCalendarVersion((v) => v + 1);
      }
    } else if (hasError) {
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
    void syncCalendarConnection();
  }, [syncCalendarConnection]);

  // Measure active nav button and update sliding indicator
  const updateIndicator = useCallback(() => {
    if (!navContainerRef.current) return;
    const activeBtn = navContainerRef.current.querySelector(
      '[data-active="true"]'
    ) as HTMLElement | null;
    if (!activeBtn) return;
    const containerRect = navContainerRef.current.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, []);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator, currentView]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <button className="flex items-center gap-2 group" onClick={() => setCurrentView("uploads")}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SC</span>
            </div>
            <h1 className="font-semibold text-gray-900 hover-bounce">
              {"Syllabus Calendar".split("").map((char, i) =>
              char === " " ? (<span key={i}>&nbsp;</span>) : (<span key={i} className="inline-block" style={{ animationDelay: `${i * 0.035}s` }}>{char}</span>))}
            </h1>
          </button>
            <div className="flex gap-2 items-center">
              <div ref={navContainerRef} className="relative flex gap-2 items-center">
                {/* Sliding purple indicator */}
                <div
                  className="absolute top-0 h-full bg-indigo-600 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  style={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                  }}
                />

                <button
                  data-active={currentView === "uploads"}
                  onClick={() => setCurrentView("uploads")}
                  className={`relative z-10 px-5 py-2 text-sm rounded-lg font-medium transition-colors duration-200 ${
                    currentView === "uploads"
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Upload
                </button>

                <button
                  data-active={currentView === "calendar"}
                  onClick={() => setCurrentView("calendar")}
                  className={`relative z-10 px-5 py-2 text-sm rounded-lg font-medium transition-colors duration-200 ${
                    currentView === "calendar"
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Calendar
                </button>

                <button
                  data-active={currentView === "study-plan"}
                  onClick={() => {
                    if (!isAuthenticated) { router.push("/auth/login"); return; }
                    setCurrentView("study-plan");
                  }}
                  className={`relative z-10 px-5 py-2 text-sm rounded-lg font-medium transition-colors duration-200 ${
                    currentView === "study-plan"
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Planner
                </button>

                <button
                  data-active={currentView === "profile"}
                  onClick={handleProfileClick}
                  className={`relative z-10 px-5 py-2 text-sm rounded-lg font-medium transition-colors duration-200 ${
                    currentView === "profile"
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Settings
                </button>
              </div>

              {isAuthenticated && (
                <LogoutButton
                  variant="ghost"
                  className="px-5 py-2 h-auto text-sm rounded-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 border-none shadow-none transition-colors"
                >
                  Logout
                </LogoutButton>
              )}
              {!isAuthenticated && (
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-5 py-2 text-sm rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === "uploads" && (
          <Uploads
            initialAccessToken={accessToken}
            onAccessTokenChange={setAccessToken}
            isAuthenticated={isAuthenticated}
          />
        )}
        {currentView === "calendar" && (
          <Calendar
            key={calendarVersion}
            accessToken={accessToken}
            onGoToUploads={() => setCurrentView("uploads")}
          />
        )}
        {currentView === "study-plan" && (
          <StudyPlan
            accessToken={accessToken}
            onGoToUploads={() => setCurrentView("uploads")}
            isAuthenticated={isAuthenticated}
          />
        )}
        {currentView === "profile" && (
          <Profile
            accessToken={accessToken}
            onGoToUploads={() => setCurrentView("uploads")}
          />
        )}
      </main>
    </div>
  );
}
