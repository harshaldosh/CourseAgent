import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { dbService } from '../services/database';
import { enrollmentService } from '../services/enrollment';
import type { Course } from '../types/course';
import CourseCard from '../components/CourseCard';
import toast from 'react-hot-toast';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
    loadEnrollments();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await dbService.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      const enrollments = await enrollmentService.getUserEnrollments();
      setEnrolledCourses(new Set(enrollments));
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    }
  };

  const handleCourseClick = (course: Course) => {
    const isEnrolled = enrolledCourses.has(course.id);
    if (isEnrolled) {
      navigate(`/courses/enrolled/${course.id}`);
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollmentService.enrollInCourse(courseId);
      const newEnrollments = new Set(enrolledCourses);
      newEnrollments.add(courseId);
      setEnrolledCourses(newEnrollments);
      toast.success('Successfully enrolled in course!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in course');
    }
  };

  const handleAddCourse = () => {
    navigate('/courseadd');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-2">Manage and view all your courses</p>
        </div>
        
        <button
          onClick={handleAddCourse}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first course</p>
          <button
            onClick={handleAddCourse}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={handleCourseClick}
              isEnrolled={enrolledCourses.has(course.id)}
              onEnrollClick={handleEnroll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;