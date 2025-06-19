import React, { useEffect, useState } from 'react';
import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';
import { dbService } from '../services/database';
import type { Course } from '../types/course';

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await dbService.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = courses.reduce((acc, course) => acc + course.fees, 0);
  const totalVideos = courses.reduce((acc, course) => 
    acc + course.chapters.reduce((chapterAcc, chapter) => chapterAcc + chapter.videos.length, 0), 0
  );

  const stats = [
    {
      title: 'Total Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Students',
      value: '1,234',
      icon: Users,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%'
    },
    {
      title: 'Total Videos',
      value: totalVideos,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+5%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your courses.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">{stat.change}</span>
              <span className="text-gray-600 text-sm ml-2">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Courses</h2>
        </div>
        <div className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No courses available. Create your first course to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600">{course.chapters.length} chapters</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${course.fees}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;