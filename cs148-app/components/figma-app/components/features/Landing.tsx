'use client';

import { Calendar, FileText, Brain, TrendingUp } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Syllabus Calendar
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 font-medium mb-4">
            From Syllabus to Success
          </p>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Upload your course syllabuses and let AI transform them into an organized calendar with smart study plans
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mt-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white border border-white/20">
            <FileText className="w-10 h-10 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Upload Syllabuses</h3>
            <p className="text-white/80 text-sm">
              Simply upload your PDF syllabuses and we'll extract all the important dates
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white border border-white/20">
            <Calendar className="w-10 h-10 mb-4" />
            <h3 className="font-semibold text-lg mb-2">View Your Schedule</h3>
            <p className="text-white/80 text-sm">
              See all your classes, assignments, and exams in one visual calendar
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white border border-white/20">
            <Brain className="w-10 h-10 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Smart Study Plans</h3>
            <p className="text-white/80 text-sm">
              Get personalized study time suggestions based on your schedule
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white border border-white/20">
            <TrendingUp className="w-10 h-10 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
            <p className="text-white/80 text-sm">
              Monitor your assignment completion and stay on top of your goals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
