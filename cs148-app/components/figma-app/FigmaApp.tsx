"use client";

import { useState } from "react";

import { Landing } from "@/components/figma-app/components/features/Landing";
import { Uploads } from "@/components/figma-app/components/features/Uploads";
import { Calendar } from "@/components/figma-app/components/features/Calendar";
import { StudyPlan } from "@/components/figma-app/components/features/StudyPlan";
import { Profile } from "@/components/figma-app/components/features/Profile";

type View = "landing" | "uploads" | "calendar" | "study-plan" | "profile";

export default function FigmaApp() {
  const [currentView, setCurrentView] = useState<View>("landing");

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
        {currentView === "uploads" && <Uploads />}
        {currentView === "calendar" && <Calendar />}
        {currentView === "study-plan" && <StudyPlan />}
        {currentView === "profile" && <Profile />}
      </main>
    </div>
  );
}
