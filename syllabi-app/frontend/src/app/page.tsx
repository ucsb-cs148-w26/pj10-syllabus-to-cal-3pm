'use client';

import { signIn } from "next-auth/react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-3xl">

        <h1 className="text-6xl font-bold text-indigo-900 mb-6">
          pj10-syllabus-to-cal-3pm
        </h1>

        <p className="text-2xl text-indigo-700 mb-4 font-medium">
          Transform Your Syllabus Into Success
        </p>

        <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
          Upload your course syllabi and watch as we automatically extract assignments, 
          deadlines, and exams to create a personalized study calendar. Stay organized, 
          never miss a deadline, and optimize your study schedule with AI-powered recommendations.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/has_navbar/upload" })}
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Sign in with Google
        </button>


      </div>
    </div>
  );
}
