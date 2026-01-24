// ============================================
// FILE: frontend/src/app/page.tsx
// ============================================

'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-3xl">
        {/* EDIT: Update your app name and slogan here */}
        <h1 className="text-6xl font-bold text-indigo-900 mb-6">
          SyllaSync
        </h1>
        <p className="text-2xl text-indigo-700 mb-4 font-medium">
          Transform Your Syllabus Into Success
        </p>
        <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
          {/* EDIT: Update app description */}
          Upload your course syllabi and watch as we automatically extract assignments, 
          deadlines, and exams to create a personalized study calendar. Stay organized, 
          never miss a deadline, and optimize your study schedule with AI-powered recommendations.
        </p>
        
        <button
          onClick={() => router.push('/uploads')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}