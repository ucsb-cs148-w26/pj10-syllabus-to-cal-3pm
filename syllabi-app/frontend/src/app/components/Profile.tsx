'use client';

import { Award, BookOpen, Calendar, CheckCircle, Clock, FileText, Target, TrendingUp, User } from 'lucide-react';

export default function Profile() {
  // User information
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    studentId: 'STU-2024-001',
    major: 'Computer Science',
    year: 'Junior',
    gpa: '3.85'
  };

  // Course enrollment and progress
  const courses = [
    {
      code: 'CS 101',
      name: 'Introduction to Programming',
      instructor: 'Dr. Smith',
      progress: 85,
      assignments: { completed: 8, total: 10 },
      nextDeadline: 'Final Project - Dec 15'
    },
    {
      code: 'MATH 201',
      name: 'Calculus II',
      instructor: 'Prof. Johnson',
      progress: 70,
      assignments: { completed: 6, total: 12 },
      nextDeadline: 'Problem Set 7 - Dec 8'
    },
    {
      code: 'ENG 150',
      name: 'Academic Writing',
      instructor: 'Dr. Williams',
      progress: 92,
      assignments: { completed: 10, total: 11 },
      nextDeadline: 'Final Essay - Dec 12'
    },
    {
      code: 'PHYS 110',
      name: 'Physics I',
      instructor: 'Dr. Brown',
      progress: 65,
      assignments: { completed: 5, total: 10 },
      nextDeadline: 'Lab Report 3 - Dec 10'
    }
  ];

  // Calculate overall stats
  const totalAssignments = courses.reduce((sum, course) => sum + course.assignments.total, 0);
  const completedAssignments = courses.reduce((sum, course) => sum + course.assignments.completed, 0);
  const overallProgress = Math.round((completedAssignments / totalAssignments) * 100);

  const stats = [
    {
      label: 'Courses Enrolled',
      value: courses.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Total Assignments',
      value: totalAssignments,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Completed',
      value: completedAssignments,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Current GPA',
      value: user.gpa,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const recentActivity = [
    { action: 'Completed', item: 'Math Homework 3', course: 'MATH 201', time: '2 hours ago' },
    { action: 'Submitted', item: 'Final Essay Draft', course: 'ENG 150', time: '1 day ago' },
    { action: 'Viewed', item: 'Week 12 Syllabus', course: 'CS 101', time: '2 days ago' },
    { action: 'Completed', item: 'Lab Report 2', course: 'PHYS 110', time: '3 days ago' }
  ];

  // Render pixel blocks for progress bar - RETRO STYLE
  const renderPixelBar = (progress: number) => {
    const blocks = 20;
    const filledBlocks = Math.round((progress / 100) * blocks);
    
    return (
      <div className="flex gap-1">
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            className={`h-4 flex-1 border-2 ${
              i < filledBlocks 
                ? 'bg-indigo-600 border-indigo-800' 
                : 'bg-gray-200 border-gray-300'
            } transition-all duration-300`}
            style={{ boxShadow: i < filledBlocks ? '2px 2px 0px rgba(0,0,0,0.2)' : 'none' }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* RETRO PROFILE PICTURE */}
            <div className="w-24 h-24 bg-indigo-500 border-4 border-indigo-700 flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
              <User className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Student ID:</span> {user.studentId}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Major:</span> {user.major}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Year:</span> {user.year}
                </span>
              </div>
              <p className="text-gray-500 mt-1">{user.email}</p>
            </div>
            <div className="text-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
              <div className="text-3xl font-bold text-indigo-600">{user.gpa}</div>
              <div className="text-sm text-gray-600 font-medium">Current GPA</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Course Progress Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Overall Progress</h2>
                <span className="text-3xl font-bold text-indigo-600">{overallProgress}%</span>
              </div>
              {/* RETRO PIXEL PROGRESS BAR */}
              {renderPixelBar(overallProgress)}
              <p className="text-sm text-gray-600 mt-3">
                {completedAssignments} of {totalAssignments} assignments completed across all courses
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Course Progress</h2>
              <div className="space-y-6">
                {courses.map((course, index) => (
                  <div key={index} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.code}</h3>
                        <p className="text-sm text-gray-600">{course.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{course.instructor}</p>
                      </div>
                      <span className="text-lg font-bold text-indigo-600">{course.progress}%</span>
                    </div>
                    {/* RETRO PIXEL PROGRESS BAR */}
                    {renderPixelBar(course.progress)}
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-gray-600">
                        {course.assignments.completed}/{course.assignments.total} assignments
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.nextDeadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Achievements */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8" />
                <h2 className="text-xl font-bold">Achievements</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🎯</span>
                    <span className="font-semibold">Quick Starter</span>
                  </div>
                  <p className="text-sm text-white/90">Completed first assignment</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🔥</span>
                    <span className="font-semibold">On Fire</span>
                  </div>
                  <p className="text-sm text-white/90">5-day submission streak</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">⭐</span>
                    <span className="font-semibold">Honor Roll</span>
                  </div>
                  <p className="text-sm text-white/90">Maintain 3.5+ GPA</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action} <span className="font-normal text-gray-600">{activity.item}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.course} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Card */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-md p-6 text-white">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-bold text-lg mb-2">Keep Going!</h3>
              <p className="text-sm text-white/90">
                You're {100 - overallProgress}% away from completing all your assignments. 
                Stay focused and finish strong!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}