import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, DollarSign, Edit, Download, Trash2, Check, ExternalLink, FileText, BookOpen, Bot } from 'lucide-react';
import { dbService } from '../services/database';
import type { Course } from '../types/course';
import toast from 'react-hot-toast';
import '../styles/course-management.css';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [completedDocuments, setCompletedDocuments] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<{ 
    type: 'video' | 'document'; 
    url: string; 
    title: string; 
    description: string 
  } | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  const isAdmin = import.meta.env.VITE_ADMIN_LOGIN === 'true';

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
        navigate('/courses');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = (courseId: string) => {
    const savedVideos = localStorage.getItem(`course-progress-videos-${courseId}`);
    const savedDocuments = localStorage.getItem(`course-progress-documents-${courseId}`);
    
    if (savedVideos) {
      setCompletedVideos(new Set(JSON.parse(savedVideos)));
    }
    if (savedDocuments) {
      setCompletedDocuments(new Set(JSON.parse(savedDocuments)));
    }
  };

  const saveProgress = (courseId: string, completedVids: Set<string>, completedDocs: Set<string>) => {
    localStorage.setItem(`course-progress-videos-${courseId}`, JSON.stringify([...completedVids]));
    localStorage.setItem(`course-progress-documents-${courseId}`, JSON.stringify([...completedDocs]));
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
      saveProgress(id, newCompleted, completedDocuments);
    }
  };

  const toggleDocumentCompletion = (documentId: string) => {
    const newCompleted = new Set(completedDocuments);
    if (newCompleted.has(documentId)) {
      newCompleted.delete(documentId);
    } else {
      newCompleted.add(documentId);
    }
    setCompletedDocuments(newCompleted);
    if (id) {
      saveProgress(id, completedVideos, newCompleted);
    }
  };

  const openContentPopup = (type: 'video' | 'document', url: string, title: string, description: string) => {
    setSelectedContent({ type, url, title, description });
  };

  const closeContentPopup = () => {
    setSelectedContent(null);
  };

  const handleEditCourse = () => {
    navigate(`/courses/${id}/edit`);
  };

  const handleDeleteCourse = async () => {
    if (!course || !id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"? This action cannot be undone and will delete all chapters and content.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await dbService.deleteCourse(id);
      toast.success('Course deleted successfully');
      navigate('/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const isChapterComplete = (chapter: any) => {
    const chapterVideos = chapter.videos || [];
    const chapterDocuments = (chapter.documents || []).filter((doc: any) => !doc.isSpecial);
    
    const videosComplete = chapterVideos.every((video: any) => completedVideos.has(video.id));
    const documentsComplete = chapterDocuments.every((doc: any) => completedDocuments.has(doc.id));
    
    return videosComplete && documentsComplete;
  };

  const getSpecialDocuments = () => {
    if (!course) return [];
    
    const specialDocs: any[] = [];
    course.chapters.forEach((chapter, chapterIndex) => {
      const chapterSpecialDocs = (chapter.documents || [])
        .filter(doc => doc.isSpecial)
        .map(doc => ({
          ...doc,
          chapterTitle: chapter.title,
          chapterIndex: chapterIndex + 1,
          isUnlocked: isChapterComplete(chapter)
        }));
      specialDocs.push(...chapterSpecialDocs);
    });
    
    return specialDocs;
  };

  const getAllDocuments = () => {
    if (!course) return [];
    
    const allDocs: any[] = [];
    course.chapters.forEach((chapter, chapterIndex) => {
      const chapterDocs = (chapter.documents || []).map(doc => ({
        ...doc,
        chapterTitle: chapter.title,
        chapterIndex: chapterIndex + 1,
        isCompleted: completedDocuments.has(doc.id)
      }));
      allDocs.push(...chapterDocs);
    });
    
    return allDocs;
  };

  const getContentItems = (chapter: any) => {
    const items: any[] = [];
    
    // Add videos
    (chapter.videos || []).forEach((video: any, index: number) => {
      items.push({
        ...video,
        type: 'video',
        sortOrder: `video-${index}`,
        chapterIndex: course?.chapters.findIndex(c => c.id === chapter.id) || 0
      });
    });
    
    // Add documents
    (chapter.documents || []).forEach((document: any, index: number) => {
      items.push({
        ...document,
        type: 'document',
        sortOrder: `document-${index}`,
        chapterIndex: course?.chapters.findIndex(c => c.id === chapter.id) || 0
      });
    });
    
    // Add agents
    (chapter.agents || []).forEach((agent: any, index: number) => {
      items.push({
        ...agent,
        type: 'agent',
        sortOrder: `agent-${index}`,
        chapterIndex: course?.chapters.findIndex(c => c.id === chapter.id) || 0
      });
    });
    
    return items.sort((a, b) => a.sortOrder.localeCompare(b.sortOrder));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">Course not found</h2>
        <button
          onClick={() => navigate('/courses')}
          className="btn-responsive bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const totalVideos = course.chapters.reduce((acc, chapter) => acc + chapter.videos.length, 0);
  const totalAgents = course.chapters.reduce((acc, chapter) => acc + (chapter.agents || []).length, 0);
  const totalDocuments = course.chapters.reduce((acc, chapter) => acc + (chapter.documents || []).length, 0);
  const completedVideoCount = completedVideos.size;
  const completedDocumentCount = completedDocuments.size;
  const progressPercentage = totalVideos > 0 ? (completedVideoCount / totalVideos) * 100 : 0;

  const specialDocuments = getSpecialDocuments();
  const allDocuments = getAllDocuments();

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-responsive-lg font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2 text-responsive-sm">Course Details</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
            className="btn-responsive bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge Base
          </button>
          
          {isAdmin && (
            <>
              <button
                onClick={handleEditCourse}
                className="btn-responsive bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="btn-responsive bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Course'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Knowledge Base Modal */}
      {showKnowledgeBase && (
        <div className="bg-white rounded-lg shadow-md card-responsive space-responsive">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-responsive-lg font-semibold text-gray-900">Knowledge Base - All Documents</h2>
            <button
              onClick={() => setShowKnowledgeBase(false)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          {allDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-responsive-sm">No documents available in this course.</p>
            </div>
          ) : (
            <div className="knowledge-base-grid">
              {allDocuments.map((doc) => (
                <div key={doc.id} className="document-card-kb">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900 text-responsive-sm">{doc.title}</h3>
                        <p className="text-xs text-gray-500">Chapter {doc.chapterIndex}: {doc.chapterTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.isSpecial && (
                        <span className="status-badge status-special">Special</span>
                      )}
                      {doc.isCompleted && (
                        <span className="status-badge status-completed">Completed</span>
                      )}
                    </div>
                  </div>
                  
                  {doc.description && (
                    <p className="text-responsive-sm text-gray-600 mb-3">{doc.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openContentPopup('document', doc.url, doc.title, doc.description || '')}
                      className="text-blue-600 hover:text-blue-700 text-responsive-sm font-medium flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Document
                    </button>
                    
                    {!doc.isSpecial && (
                      <button
                        onClick={() => toggleDocumentCompletion(doc.id)}
                        className={`status-badge ${doc.isCompleted ? 'status-completed' : 'status-pending'}`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {doc.isCompleted ? 'Completed' : 'Mark Done'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="course-grid">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Course Description */}
          <div className="bg-white rounded-lg shadow-md card-responsive">
            <h2 className="text-responsive-base font-semibold text-gray-900 mb-4">About This Course</h2>
            <p className="text-gray-700 leading-relaxed text-responsive-sm">{course.description}</p>
          </div>

          {/* Special Downloads */}
          {specialDocuments.length > 0 && (
            <div className="special-downloads">
              <h2 className="text-responsive-base font-semibold mb-2">Special Downloads</h2>
              <p className="text-responsive-sm opacity-90 mb-4">
                These documents become available when you complete their respective chapters.
              </p>
              
              <div className="downloads-grid">
                {specialDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`download-item ${!doc.isUnlocked ? 'disabled' : ''}`}
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <h3 className="font-medium text-responsive-sm mb-1">{doc.title}</h3>
                    <p className="text-xs opacity-75 mb-2">Chapter {doc.chapterIndex}: {doc.chapterTitle}</p>
                    
                    {doc.isUnlocked ? (
                      <button
                        onClick={() => openContentPopup('document', doc.url, doc.title, doc.description || '')}
                        className="inline-flex items-center text-responsive-sm font-medium hover:underline"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </button>
                    ) : (
                      <span className="text-xs opacity-75">Complete chapter to unlock</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Content Table */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="card-responsive border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-responsive-base font-semibold text-gray-900">Course Content</h2>
                <div className="text-responsive-sm text-gray-600">
                  {completedVideoCount} of {totalVideos} videos, {completedDocumentCount} of {totalDocuments} documents completed
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
            
            <div className="content-table-container">
              <table className="content-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-hidden">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-hidden">
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
                          <div className="font-medium text-gray-900 text-responsive-sm">
                            Chapter {chapterIndex + 1}: {chapter.title}
                          </div>
                          {chapter.description && (
                            <div className="text-xs text-gray-600 mt-1">
                              {chapter.description}
                            </div>
                          )}
                        </td>
                      </tr>
                      
                      {/* Content Items */}
                      {getContentItems(chapter).map((item, itemIndex) => (
                        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              {item.type === 'video' && <Play className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />}
                              {item.type === 'document' && <FileText className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${item.isSpecial ? 'text-green-500' : 'text-yellow-500'}`} />}
                              {item.type === 'agent' && <Bot className="w-4 h-4 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />}
                              <div className="min-w-0 content-title">
                                <div className="font-medium text-gray-900 text-responsive-sm">
                                  {chapterIndex + 1}.{itemIndex + 1} {item.title}
                                  {item.type === 'document' && item.isSpecial && <span className="ml-2 text-xs text-green-600 font-medium">(Special)</span>}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 mobile-hidden">
                            <span className={`status-badge ${
                              item.type === 'video' ? '' : 
                              item.type === 'document' && item.isSpecial ? 'status-special' : 
                              item.type === 'document' ? '' : ''
                            }`} 
                                  style={{
                                    backgroundColor: 
                                      item.type === 'video' ? '#dbeafe' : 
                                      item.type === 'document' && item.isSpecial ? '#ddd6fe' : 
                                      item.type === 'document' ? '#fef3c7' : 
                                      '#f3e8ff',
                                    color: 
                                      item.type === 'video' ? '#1e40af' : 
                                      item.type === 'document' && item.isSpecial ? '#5b21b6' : 
                                      item.type === 'document' ? '#92400e' : 
                                      '#7c3aed'
                                  }}>
                              {item.type === 'video' ? 'Video' : 
                               item.type === 'document' && item.isSpecial ? 'Special Doc' : 
                               item.type === 'document' ? 'Document' : 
                               'Agent'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-responsive-sm text-gray-500 mobile-hidden">
                            {item.type === 'video' ? (item.duration || 'N/A') : 
                             item.type === 'document' ? 'PDF/Doc' : 
                             'Interactive'}
                          </td>
                          <td className="px-6 py-4">
                            {item.type === 'video' && (
                              <button
                                onClick={() => toggleVideoCompletion(item.id)}
                                className={`status-badge ${
                                  completedVideos.has(item.id) ? 'status-completed' : 'status-pending'
                                }`}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                {completedVideos.has(item.id) ? 'Completed' : 'Mark Done'}
                              </button>
                            )}
                            {item.type === 'document' && item.isSpecial && (
                              <span className={`status-badge ${isChapterComplete(chapter) ? 'status-completed' : 'status-pending'}`}>
                                {isChapterComplete(chapter) ? 'Unlocked' : 'Locked'}
                              </span>
                            )}
                            {item.type === 'document' && !item.isSpecial && (
                              <button
                                onClick={() => toggleDocumentCompletion(item.id)}
                                className={`status-badge ${
                                  completedDocuments.has(item.id) ? 'status-completed' : 'status-pending'
                                }`}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                {completedDocuments.has(item.id) ? 'Completed' : 'Mark Done'}
                              </button>
                            )}
                            {item.type === 'agent' && (
                              <span className="status-badge" style={{backgroundColor: '#f3f4f6', color: '#374151'}}>
                                Available
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {item.type === 'video' && item.url && (
                              <button
                                onClick={() => openContentPopup('video', item.url, item.title, item.description || '')}
                                className="btn-responsive bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Watch
                              </button>
                            )}
                            {item.type === 'document' && item.url && (
                              <button
                                onClick={() => openContentPopup('document', item.url, item.title, item.description || '')}
                                className="btn-responsive bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </button>
                            )}
                            {item.type === 'agent' && (
                              <button className="btn-responsive bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs flex items-center">
                                <Bot className="w-3 h-3 mr-1" />
                                Chat
                              </button>
                            )}
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
          <div className="bg-white rounded-lg shadow-md card-responsive">
            <h3 className="text-responsive-base font-semibold text-gray-900 mb-4">Course Overview</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Price</span>
                </div>
                <span className="font-semibold text-primary-600 text-responsive-sm">${course.fees}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Chapters</span>
                </div>
                <span className="font-semibold text-responsive-sm">{course.chapters.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Play className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Videos</span>
                </div>
                <span className="font-semibold text-responsive-sm">{totalVideos}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <FileText className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Documents</span>
                </div>
                <span className="font-semibold text-responsive-sm">{totalDocuments}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Bot className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">AI Assistants</span>
                </div>
                <span className="font-semibold text-responsive-sm">{totalAgents}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Progress</span>
                </div>
                <span className="font-semibold text-green-600 text-responsive-sm">{Math.round(progressPercentage)}%</span>
              </div>
            </div>

            {course.courseMaterialUrl && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={course.courseMaterialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full btn-responsive bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Course Materials
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Popup Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-responsive-base font-semibold text-gray-900">{selectedContent.title}</h3>
              <button
                onClick={closeContentPopup}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              {selectedContent.type === 'video' ? (
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={selectedContent.url}
                    className="w-full h-full"
                    allowFullScreen
                    title={selectedContent.title}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                  <iframe
                    src={selectedContent.url}
                    className="w-full h-full"
                    title={selectedContent.title}
                  />
                </div>
              )}
              
              {selectedContent.description && (
                <div className="text-gray-700 text-responsive-sm">
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p>{selectedContent.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;