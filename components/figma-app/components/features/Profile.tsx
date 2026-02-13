'use client';

import { Award, CheckCircle, Target, TrendingUp, Calendar, BookOpen, ChevronRight } from 'lucide-react';

export function Profile() {
  const totalAssignments = 12;
  const completedAssignments = 7;
  const progressPercentage = (completedAssignments / totalAssignments) * 100;

  const stats = [
    { label: 'Completed', value: completedAssignments, icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Total Tasks', value: totalAssignments, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Study Streak', value: '5 days', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Current Level', value: '8', icon: Award, color: 'text-blue-700', bg: 'bg-blue-100' }
  ];

  const recentCompletions = [
    { name: 'Math Homework 3', course: 'MATH 201', date: '2 days ago', score: '95%' },
    { name: 'Reading Assignment', course: 'ENG 150', date: '3 days ago', score: '100%' },
    { name: 'Lab Report 2', course: 'CS 101', date: '5 days ago', score: '88%' },
    { name: 'Discussion Post', course: 'ENG 150', date: '6 days ago', score: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-slate-900 text-white pt-16 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-2">Academic Dashboard</h2>
            <p className="text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Spring Semester 2024 • Welcome back, Scholar!
            </p>
          </div>
          <button className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-400/20 active:scale-95">
            Continue Learning
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Profile & Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-3xl bg-slate-100 flex items-center justify-center text-5xl shadow-inner border-4 border-white overflow-hidden">
                  👨‍🎓
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full border-4 border-white">
                  PRO
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900">Student Scholar</h3>
                <p className="text-slate-500 font-medium">Computer Science Major</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-slate-600">Level 8 Experience</span>
                  <span className="text-blue-600">65%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: '65%' }}
                  ></div>
                </div>
                <p className="text-center text-xs text-slate-400">1,250 XP until Level 9</p>
              </div>
            </div>

            {/* Quote/Motivation Card */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
               <BookOpen className="w-8 h-8 mb-4 text-blue-200" />
               <p className="italic text-blue-50 font-medium mb-4">"The beautiful thing about learning is that nobody can take it away from you."</p>
               <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">— B.B. King</p>
            </div>
          </div>

          {/* Right Column: Main Progress */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{stat.label}</p>
                    <p className="text-xl font-black text-slate-900">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Main Progress Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Assignment Mastery</h3>
                  <p className="text-slate-500 text-sm italic">Tracking current semester goals</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-blue-600 leading-none">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-100 border border-slate-200">
                  <div
                    style={{ width: `${progressPercentage}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-400 transition-all duration-700"
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-600">{completedAssignments} Tasks Done</span>
                  <span className="text-slate-400">{totalAssignments - completedAssignments} Remaining</span>
                </div>
              </div>
            </div>

            {/* Activity List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Recent Activity</h3>
                <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
              </div>
              <div className="divide-y divide-slate-100">
                {recentCompletions.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors cursor-default group">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                      <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{item.course}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{item.score}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{item.date}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}