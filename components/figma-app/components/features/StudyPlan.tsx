'use client';

import { Clock, Calendar, BookOpen, ScrollText } from 'lucide-react';
import { useState } from 'react';
import type { StudySession } from '@/lib/studySessionScheduling'
import type { CalendarEvent } from '@/lib/googleCalendar';
import { get_events } from "@/components/figma-app/components/features/Uploads";
import {schedule_sessions } from "@/lib/studySessionScheduling"

export function StudyPlan() {
  //todo: check if deletion/editing is still reflected in this list
  const events = get_events();
  
  const studySessions : StudySession[] = schedule_sessions(events);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_5%,theme(colors.indigo.100),transparent_55%),radial-gradient(1000px_circle_at_80%_35%,theme(colors.violet.100),transparent_60%),linear-gradient(to_bottom,theme(colors.white),theme(colors.slate.50))] transition-all duration-700" />

      <div className="mb-2 shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-0.5">Smart Study Plan</h2>
        <p className="text-xs text-gray-600">
          Personalized study times based on your class schedule and assignment deadlines
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">Coming Soon</h3>
            <p className="text-indigo-700 text-sm">
              This page will eventually allow you to receive an automatic study and homework plan with priority levels based on your calendar schedule. 
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {studySessions.map(session => (
          <div
            key={session.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {session.assignment}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(session.priority)}`}>
                    {session.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-1">{session.course}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-sm">{session.date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-sm">{session.suggestedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="text-sm">{session.duration}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Mark as Scheduled
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
