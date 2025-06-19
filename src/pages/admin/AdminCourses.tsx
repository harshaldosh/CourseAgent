import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { dbService } from '../../services/database';
import type { Course } from '../../types/course';
import toast from 'react-hot-toast';

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
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

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${courseTitle}"? This action cannot be undone and will delete all chapters and videos.`
    );

    if (!confirmed) return;

    setDeleting(courseId);
    try {
      await dbService.deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage all your courses</p>
        </div>
        
        <Link
          to="/admin/courses/add"
          className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Course
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            All Courses ({filteredCourses.length})
          </h2>
        </div>
        
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'No courses found' : 'No courses yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Get started by creating your first course'
              }
            </p>
            {!searchTerm && (
              <Link
                to="/admin/courses/add"
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Create Your First Course
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => {
                  const totalVideos = course.chapters.reduce((acc, chapter) => acc + chapter.videos.length, 0);
                  
                  return (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img 
                            src={course.image} 
                            alt={course.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                              {course.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div>{course.chapters.length} chapters</div>
                          <div className="text-gray-500">{totalVideos} videos</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${course.fees}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/courses/${course.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Course"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/courses/${course.id}/edit`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Edit Course"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteCourse(course.id, course.title)}
                            disabled={deleting === course.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;