'use client';

import { Clock, Calendar, BookOpen } from 'lucide-react';
import { useState } from 'react';
import type { CalendarEvent } from '@/lib/googleCalendar';
import { get_events } from "@/components/figma-app/components/features/Uploads";

interface StudySession {
  id: string;
  assignment: string;
  course: string;
  suggestedTime: string;
  duration: string;
  date: string;
  score: number;
  priority: 'high' | 'medium' | 'low';

}
//function to help compare study sessions for sort
function compare_study_sessions(a : StudySession, b : StudySession){
  if(Number.isNaN(a.score) && Number.isNaN(b.score)) return 0;
  if(Number.isNaN(a.score)) return 1;
  if(Number.isNaN(b.score)) return -1;
  if(a.score >= 0 && b.score < 0) return -1;
  if(a.score < 0 && b.score >= 0) return 1;
  if(a.score < b.score) return -1;
  if(a.score > b.score) return 1;
  return 0;
}
function priority_score(event : CalendarEvent){
    //higher score: lower priority
    //consts
    const TIME_MULTIPLICATIVE_WEIGHT : number = 10; //per hour
    const NOT_EXAM_ADDITIVE_WEIGHT : number = TIME_MULTIPLICATIVE_WEIGHT * 2.1 * 24; //proritize exam if 2 there's one two days after another event
    let score = NOT_EXAM_ADDITIVE_WEIGHT;

    //regexp to validate date formatting
    const pattern : RegExp = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}")
    let start : Date | undefined;
    let end : Date | undefined;
    if(event.start !== undefined && pattern.test(event.start)){
      start = new Date(event.start);
    }
    else{
      return NaN;
    }

    //*note: end is pretty much never defined; probably will not use; not currently using
    if(event.end !== undefined && pattern.test(event.end)){
      end = new Date(event.end);
    }
    
    // if(end.getTime() < start.getTime()){
    //   throw new Error("End time before start");
    // }
      
      const time_until_start : number = (start.getTime() - (new Date()).getTime()) / 1000 / 60 / 60; //ms -> hours
      score += time_until_start * TIME_MULTIPLICATIVE_WEIGHT
      
      const split_title : Array<string> = event.title.trim().split(" ")
      for(let a = 0; a < split_title.length; a++){
        split_title[a] = split_title[a].trim().toLowerCase();
      }
      const EXAM_KEYWORDS : Set<string> = new Set<string>(["final", "midterm", "exam", "test", "project"])
      for(const word of split_title){
        if(EXAM_KEYWORDS.has(word)){
          score -= NOT_EXAM_ADDITIVE_WEIGHT
          break;
        }
      }
    return score;
}

export function StudyPlan() {
  const HIGH_PRIORITY_THRESHOLD = 480;//~2 days
  const MEDIUM_PRIORITY_THRESHOLD = 1680;//~ 1 week
  const events = get_events();
  const studySessions : StudySession[] = [];
  for(let a=0; a<events.length; a++){
    const event = events[a];
    const score = priority_score(event);
    studySessions.push(
      {
        id: String(a),
        assignment: event.title,
        course: 'course', 
        suggestedTime: String(score), 
        duration: 'duration', 
        date: Number.isNaN(score) ? 'none' : event.start,
        score: score,
        priority: 'high'
      }
    );
  }
  studySessions.sort(compare_study_sessions);
  for(const studySession of studySessions){
    if(Number.isNaN(studySession.score) || studySession.score < 0){
      studySession.priority = 'low';
      continue;
    }
    if(studySession.score < HIGH_PRIORITY_THRESHOLD){
      studySession.priority = 'high';
      continue;
    }
    if(studySession.score < MEDIUM_PRIORITY_THRESHOLD){
      studySession.priority = 'medium';
      continue;
    }
    studySession.priority = 'low';
  }

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Smart Study Plan</h2>
        <p className="text-gray-600">
          Personalized study times based on your class schedule and assignment deadlines
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">Study Plan Generated</h3>
            <p className="text-indigo-700 text-sm">
              We've analyzed your schedule and created optimal study times for your upcoming assignments.
              These times avoid conflicts with your classes and spread out your workload evenly.
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

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Study Tips</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Take 5-10 minute breaks every hour to maintain focus</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Start with high-priority assignments when your energy is highest</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-1">•</span>
            <span>Review your study plan daily and adjust as needed</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
