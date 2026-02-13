'use client';

import { Clock, Calendar, BookOpen } from 'lucide-react';

interface StudySession {
  id: string;
  assignment: string;
  course: string;
  suggestedTime: string;
  duration: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export function StudyPlan() {
  const studySessions: StudySession[] = [
    {
      id: '1',
      assignment: 'Programming Assignment 1',
      course: 'CS 101',
      suggestedTime: '2:00 PM - 4:00 PM',
      duration: '2 hours',
      date: 'Monday, Jan 22',
      priority: 'high'
    },
    {
      id: '2',
      assignment: 'Calculus Midterm Prep',
      course: 'MATH 201',
      suggestedTime: '6:00 PM - 8:00 PM',
      duration: '2 hours',
      date: 'Monday, Jan 22',
      priority: 'high'
    },
    {
      id: '3',
      assignment: 'English Essay Outline',
      course: 'ENG 150',
      suggestedTime: '10:00 AM - 11:30 AM',
      duration: '1.5 hours',
      date: 'Tuesday, Jan 23',
      priority: 'medium'
    },
    {
      id: '4',
      assignment: 'English Essay Draft',
      course: 'ENG 150',
      suggestedTime: '3:00 PM - 5:00 PM',
      duration: '2 hours',
      date: 'Wednesday, Jan 24',
      priority: 'medium'
    },
    {
      id: '5',
      assignment: 'Calculus Practice Problems',
      course: 'MATH 201',
      suggestedTime: '4:00 PM - 6:00 PM',
      duration: '2 hours',
      date: 'Thursday, Jan 25',
      priority: 'high'
    },
    {
      id: '6',
      assignment: 'Lab Report Research',
      course: 'CS 101',
      suggestedTime: '1:00 PM - 3:00 PM',
      duration: '2 hours',
      date: 'Friday, Jan 26',
      priority: 'medium'
    },
    {
      id: '7',
      assignment: 'Calculus Final Review',
      course: 'MATH 201',
      suggestedTime: '11:00 AM - 1:00 PM',
      duration: '2 hours',
      date: 'Saturday, Jan 27',
      priority: 'high'
    }
  ];

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
