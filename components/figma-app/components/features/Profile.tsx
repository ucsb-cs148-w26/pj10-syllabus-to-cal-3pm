'use client';

import { Award, Calendar, CheckCircle, ExternalLink, FileText, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Platform = 'canvas' | 'gradescope';

interface RecentCompletion {
  name: string;
  course: string;
  completedAt: string;
  platform: Platform;
  url: string;
}

export function Profile() {
  const totalAssignments = 12;
  const completedAssignments = 7;
  const progressPercentage = (completedAssignments / totalAssignments) * 100;

  const stats = [
    { label: 'Completed', value: completedAssignments, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Total', value: totalAssignments, icon: Target, color: 'text-slate-600' },
    { label: 'Streak', value: '5 days', icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Level', value: '8', icon: Award, color: 'text-violet-600' },
  ];

  const recentCompletions: RecentCompletion[] = [
    { name: 'Math Homework 3', course: 'MATH 201', completedAt: 'Feb 4, 2025', platform: 'canvas', url: 'https://canvas.instructure.com/' },
    { name: 'Reading Assignment', course: 'ENG 150', completedAt: 'Feb 3, 2025', platform: 'canvas', url: 'https://canvas.instructure.com/' },
    { name: 'Lab Report 2', course: 'CS 101', completedAt: 'Feb 1, 2025', platform: 'gradescope', url: 'https://gradescope.com/' },
    { name: 'Discussion Post', course: 'ENG 150', completedAt: 'Jan 31, 2025', platform: 'canvas', url: 'https://canvas.instructure.com/' },
    { name: 'Quiz 2', course: 'MATH 201', completedAt: 'Jan 30, 2025', platform: 'gradescope', url: 'https://gradescope.com/' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Profile</h1>
        <p className="text-slate-500 mt-1 text-sm">Your progress and completed work</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200/80 bg-white shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-100 ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900 tabular-nums">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress section */}
      <Card className="border-slate-200/80 bg-white shadow-none mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-slate-900">Assignment progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-800 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">
            {completedAssignments} of {totalAssignments} assignments done this semester
          </p>
        </CardContent>
      </Card>

      {/* Recent completions */}
      <Card className="border-slate-200/80 bg-white shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-slate-900">Recent completions</CardTitle>
          <p className="text-sm text-slate-500 font-normal">Open in Canvas or Gradescope</p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentCompletions.map((item, index) => (
              <div
                key={index}
                className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-500">
                    <span>{item.course}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.completedAt}
                    </span>
                  </div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  title={`Open in ${item.platform === 'canvas' ? 'Canvas' : 'Gradescope'}`}
                >
                  <span className="capitalize">{item.platform}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Streak reminder */}
      <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">5-day streak.</span> Complete one more assignment to unlock a badge.
        </p>
      </div>
    </div>
  );
}
