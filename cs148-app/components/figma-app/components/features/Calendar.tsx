'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'class' | 'assignment' | 'exam';
  course: string;
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock events
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'CS 101 Lecture',
      date: new Date(2024, 0, 22),
      type: 'class',
      course: 'Computer Science'
    },
    {
      id: '2',
      title: 'Calculus II Lecture',
      date: new Date(2024, 0, 22),
      type: 'class',
      course: 'Math'
    },
    {
      id: '3',
      title: 'Programming Assignment 1',
      date: new Date(2024, 0, 25),
      type: 'assignment',
      course: 'CS 101'
    },
    {
      id: '4',
      title: 'Calculus Midterm',
      date: new Date(2024, 0, 29),
      type: 'exam',
      course: 'MATH 201'
    },
    {
      id: '5',
      title: 'English Essay Due',
      date: new Date(2024, 0, 26),
      type: 'assignment',
      course: 'ENG 150'
    },
    {
      id: '6',
      title: 'CS 101 Lecture',
      date: new Date(2024, 0, 24),
      type: 'class',
      course: 'Computer Science'
    },
    {
      id: '7',
      title: 'Lab Report Due',
      date: new Date(2024, 0, 30),
      type: 'assignment',
      course: 'CS 101'
    }
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDay = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => 
      event.date.getDate() === dateToCheck.getDate() &&
      event.date.getMonth() === dateToCheck.getMonth() &&
      event.date.getFullYear() === dateToCheck.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'class':
        return 'bg-blue-500 text-white';
      case 'assignment':
        return 'bg-yellow-500 text-white';
      case 'exam':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Your Schedule</h2>
        <p className="text-gray-600">View all your classes, assignments, and exams</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = 
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-indigo-50 border-indigo-300' : ''
                  }`}
                >
                  <div className={`font-medium text-sm mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${getEventColor(event.type)}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">Assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Exam</span>
          </div>
        </div>
      </div>
    </div>
  );
}
