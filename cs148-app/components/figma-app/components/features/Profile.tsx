'use client';

import { Award, CheckCircle, Target, TrendingUp } from 'lucide-react';

export function Profile() {
  const totalAssignments = 12;
  const completedAssignments = 7;
  const progressPercentage = (completedAssignments / totalAssignments) * 100;

  const stats = [
    {
      label: 'Assignments Completed',
      value: completedAssignments,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Total Assignments',
      value: totalAssignments,
      icon: Target,
      color: 'text-indigo-600'
    },
    {
      label: 'Study Streak',
      value: '5 days',
      icon: TrendingUp,
      color: 'text-orange-600'
    },
    {
      label: 'Level',
      value: '8',
      icon: Award,
      color: 'text-purple-600'
    }
  ];

  const recentCompletions = [
    { name: 'Math Homework 3', course: 'MATH 201', date: '2 days ago' },
    { name: 'Reading Assignment', course: 'ENG 150', date: '3 days ago' },
    { name: 'Lab Report 2', course: 'CS 101', date: '5 days ago' },
    { name: 'Discussion Post', course: 'ENG 150', date: '6 days ago' },
    { name: 'Quiz 2', course: 'MATH 201', date: '1 week ago' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Your Profile</h2>
        <p className="text-gray-600">Track your progress and achievements</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="text-6xl">🎓</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Student Scholar</h3>
            <p className="text-gray-600 text-sm mb-4">Level 8 Achiever</p>
            <div className="bg-gray-100 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-gray-500">65% to Level 9</p>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">Assignment Progress</h3>
              <span className="text-2xl font-bold text-indigo-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-6 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end px-2"
                style={{ width: `${progressPercentage}%` }}
              >
                <span className="text-white text-xs font-medium">
                  {completedAssignments}/{totalAssignments}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              You've completed {completedAssignments} out of {totalAssignments} assignments this semester
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Recent Completions</h3>
        <div className="space-y-3">
          {recentCompletions.map((item, index) => (
            <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{item.course}</p>
              </div>
              <div className="text-sm text-gray-500">{item.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🏆</div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Keep up the great work!</h3>
            <p className="text-white/90 text-sm">
              You're on a 5-day study streak. Complete one more assignment to unlock a special achievement!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
