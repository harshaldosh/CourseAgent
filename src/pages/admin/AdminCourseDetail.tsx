import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Users, DollarSign, Edit, Download, Trash2, Check, ExternalLink, Bot, Tag, Award } from 'lucide-react';
import { dbService } from '../../services/database';
import type { Course } from '../../types/course';
import toast from 'react-hot-toast';

const AdminCourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string; description: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadCourse(id);
      loadProgress(id);
    }
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      const courseData = await dbService.getCourseById(courseId);
      if (courseData) {
        setCourse(courseData);
      } else {
        toast.error('Course not found');
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = (courseId: string) => {
    const saved = localStorage.getItem(`course-progress-${courseId}`);
    if (saved) {
      setCompletedVideos(new Set(JSON.parse(saved)));
    }
  };

  const saveProgress = (courseId: string, completed: Set<string>) => {
    localStorage.setItem(`course-progress-${courseId}`, JSON.stringify([...completed]));
  };

  const toggleVideoCompletion = (videoId: string) => {
    const newCompleted = new Set(completedVideos);
    if (newCompleted.has(videoId)) {
      newCompleted.delete(videoId);
    } else {
      newCompleted.add(videoId);
    }
    setCompletedVideos(newCompleted);
    if (id) {
      saveProgress(id, newCompleted);
    }
  };

  const openVideoPopup = (videoUrl: string, videoTitle: string, videoDescription: string) => {
    setSelectedVideo({ url: videoUrl, title: videoTitle, description: videoDescription });
  };

  const closeVideoPopup = () => {
    setSelectedVideo(null);
  };

  const handleEditCourse = () => {
    navigate(`/admin/courses/${id}/edit`);
  };

  const handleDeleteCourse = async () => {
    if (!course || !id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"? This action cannot be undone and will delete all chapters and videos.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await dbService.deleteCourse(id);
      toast.success('Course deleted successfully');
      navigate('/admin/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
        <button
          onClick={() => navigate('/admin/courses')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Back to Admin Courses
        </button>
      </div>
    );
  }

  const totalVideos = course.chapters.reduce((acc, chapter) => acc + chapter.videos.length, 0);
  const totalAgents = course.chapters.reduce((acc, chapter) => acc + chapter.agents.length, 0);
  const completedCount = completedVideos.size;
  const progressPercentage = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/courses')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{course.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-gray-600">Admin Course Details</span>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{course.category}</span>
              </div>
              {course.sponsored && (
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">Sponsored</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleEditCourse}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Course
          </button>
          <button
            onClick={handleDeleteCourse}
            disabled={deleting}
            className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete Course'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{course.description}</p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Course Description</h3>
            <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg">{course.agentCourseDescription}</p>
          </div>

          {/* Course Content Table */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
                <div className="text-sm text-gray-600">
                  {completedCount} of {totalVideos} videos completed ({Math.round(progressPercentage)}%)
                </div>
              </div>
              {totalVideos > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {course.chapters.map((chapter, chapterIndex) => (
                    <React.Fragment key={chapter.id}>
                      {/* Chapter Header */}
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            Chapter {chapterIndex + 1}: {chapter.title}
                          </div>
                          {chapter.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {chapter.description}
                            </div>
                          )}
                        </td>
                      </tr>
                      
                      {/* Videos */}
                      {chapter.videos.map((video, videoIndex) => (
                        <tr key={video.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <Play className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 text-sm">
                                  {chapterIndex + 1}.{videoIndex + 1} {video.title}
                                </div>
                                {video.description && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {video.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Video
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {video.duration || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleVideoCompletion(video.id)}
                              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                completedVideos.has(video.id)
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              <Check className={`w-3 h-3 mr-1 ${
                                completedVideos.has(video.id) ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              {completedVideos.has(video.id) ? 'Completed' : 'Mark Done'}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            {video.url && (
                              <button
                                onClick={() => openVideoPopup(video.url, video.title, video.description || '')}
                                className="flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Watch
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Agents */}
                      {chapter.agents.map((agent, agentIndex) => (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <Bot className="w-4 h-4 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 text-sm">
                                  {chapterIndex + 1}.{agentIndex + 1} {agent.title}
                                </div>
                                {agent.description && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {agent.description}
                                  </div>
                                )}
                                <div className="text-xs text-purple-600 mt-1">
                                  Replica ID: {agent.replicaId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Agent
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            Interactive
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Available
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                            >
                              <Bot className="w-3 h-3 mr-1" />
                              Chat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Overview</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Tag className="w-5 h-5 mr-2" />
                  <span>Category</span>
                </div>
                <span className="font-semibold text-blue-600">{course.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Award className="w-5 h-5 mr-2" />
                  <span>Sponsored</span>
                </div>
                <span className={`font-semibold ${course.sponsored ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {course.sponsored ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span>Price</span>
                </div>
                <span className="font-semibold text-red-600">${course.fees}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>Chapters</span>
                </div>
                <span className="font-semibold">{course.chapters.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Play className="w-5 h-5 mr-2" />
                  <span>Videos</span>
                </div>
                <span className="font-semibold">{totalVideos}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Bot className="w-5 h-5 mr-2" />
                  <span>Agents</span>
                </div>
                <span className="font-semibold">{totalAgents}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Progress</span>
                </div>
                <span className="font-semibold text-green-600">{Math.round(progressPercentage)}%</span>
              </div>
            </div>

            {course.courseMaterialUrl && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={course.courseMaterialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Course Materials
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Popup Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedVideo.title}</h3>
              <button
                onClick={closeVideoPopup}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={selectedVideo.url}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              </div>
              
              {selectedVideo.description && (
                <div className="text-gray-700 text-sm">
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p>{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseDetail;