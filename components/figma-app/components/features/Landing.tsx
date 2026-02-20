'use client';

import Link from 'next/link';
import { Calendar, FileText, Brain, TrendingUp, ArrowRight } from 'lucide-react';

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background (purple-forward, not the old heavy gradient) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_circle_at_20%_10%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(900px_circle_at_80%_25%,rgba(99,102,241,0.16),transparent_60%),radial-gradient(1000px_circle_at_50%_85%,rgba(217,70,239,0.10),transparent_55%),linear-gradient(to_bottom,theme(colors.white),theme(colors.slate.50))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 -z-10 bg-gradient-to-b from-white via-white/70 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* HERO (keep original structure/text, upgraded layout) */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm ring-1 ring-slate-200">
              <Calendar className="w-5 h-5 text-violet-700" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Syllabus Calendar</span>
          </div>
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            Sign in
          </Link>
        </div>

        <div className="text-center mb-14 sm:mb-16">
          <div className="mx-auto inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-violet-200/55 via-fuchsia-200/35 to-indigo-200/35 blur-xl" />
              <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-slate-200">
                <Calendar className="w-8 h-8 text-violet-700" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 mb-4">
            Syllabus Calendar
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 font-medium mb-4">From Syllabus to Success</p>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Upload your course syllabuses and let AI transform them into an organized calendar with smart study plans
          </p>

          <Link
            href="/auth/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 text-white px-7 py-3.5 font-semibold text-base hover:bg-violet-700 transition-colors shadow-sm"
          >
            Get Started
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* subtle divider */}
          <div className="mt-12 w-full max-w-2xl mx-auto h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* FEATURES (same 4 cards, modern styling) */}
        <div className="grid md:grid-cols-4 gap-4 sm:gap-6 mt-10">
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 ring-1 ring-violet-200">
              <FileText className="w-5 h-5 text-violet-700" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mt-4 mb-2">Upload Syllabuses</h3>
            <p className="text-slate-600 text-sm">
              Simply upload your PDF syllabuses and we'll extract all the important dates
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-200">
              <Calendar className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mt-4 mb-2">View Your Schedule</h3>
            <p className="text-slate-600 text-sm">See all your classes, assignments, and exams in one visual calendar</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-50 ring-1 ring-fuchsia-200">
              <Brain className="w-5 h-5 text-fuchsia-700" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mt-4 mb-2">Smart Study Plans</h3>
            <p className="text-slate-600 text-sm">Get personalized study time suggestions based on your schedule</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 ring-1 ring-violet-200">
              <TrendingUp className="w-5 h-5 text-violet-700" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mt-4 mb-2">Track Progress</h3>
            <p className="text-slate-600 text-sm">Monitor your assignment completion and stay on top of your goals</p>
          </div>
        </div>
      </div>
    </div>
  );
}
