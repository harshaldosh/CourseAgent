import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, DollarSign, Download, Check, ExternalLink, Bot, X, FileText, BookOpen } from 'lucide-react';
import { dbService } from '../services/database';
import { enrollmentService } from '../services/enrollment';
import type { Course } from '../types/course';
import SpecialDownloadsSection from '../components/SpecialDownloadsSection';
import KnowledgeBaseModal from '../components/KnowledgeBaseModal';
import CourseOverviewSidebar from '../components/CourseOverviewSidebar';
import toast from 'react-hot-toast';
import '../styles/course-enroll-detail.css';

// Declare the ElevenLabs widget type for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
      };
    }
  }
}

const CourseEnrollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [completedDocuments, setCompletedDocuments] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<{ 
    type: 'video' | 'document'; 
    url?: string; 
    title: string; 
    description: string;
    replicaId?: string;
    conversationalContext?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'document' | 'agent'>('content');
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  useEffect(() => {
    if (id) {
      loadCourse(id);
      loadProgress(id);
    }
  }, [id]);

  useEffect(() => {
    // Load ElevenLabs widget script if course has agent ID
    if (course?.agentId) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.head.appendChild(script);

      return () => {
        // Cleanup script on unmount
        const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [course?.agentId]);

  useEffect(() => {
    // Clear any cached data for this course
    const clearCourseCache = () => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(`course-${id}`) || key.includes('course-progress')) {
          localStorage.removeItem(key);
        }
      });
    };

    clearCourseCache();
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      const timestamp = Date.now();
      console.log(`Loading course ${courseId} at ${timestamp}`);
      
      const courseData = await dbService.getCourseById(courseId);
      if (courseData) {
        setCourse(courseData);
        console.log('Course loaded successfully:', courseData);
      } else {
        toast.error('Course not found. Redirecting to courses list.');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error(`Failed to load course: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (courseId: string) => {
    try {
      const progress = await enrollmentService.getProgress(courseId);
      const completedVideoIds = Object.keys(progress).filter(videoId => progress[videoId]);
      setCompletedVideos(new Set(completedVideoIds));
      
      // Load document progress from localStorage for now
      const savedDocuments = localStorage.getItem(`course-progress-documents-${courseId}`);
      if (savedDocuments) {
        setCompletedDocuments(new Set(JSON.parse(savedDocuments)));
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      toast.error(`Failed to load course progress: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const toggleVideoCompletion = async (videoId: string) => {
    if (!id) {
      toast.error('Course ID is missing for progress update.');
      return;
    }

    const isCompleted = completedVideos.has(videoId);
    const newCompleted = new Set(completedVideos);
    
    if (isCompleted) {
      newCompleted.delete(videoId);
    } else {
      newCompleted.add(videoId);
    }
    
    setCompletedVideos(newCompleted);

    try {
      await enrollmentService.updateProgress(id, videoId, !isCompleted);
      toast.success(isCompleted ? 'Video marked as incomplete.' : 'Video marked as complete!');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error(`Failed to update progress: ${(error as Error).message || 'Please try again.'}`);
      setCompletedVideos(completedVideos);
    }
  };

  const toggleDocumentCompletion = (documentId: string) => {
    if (!id) return;

    const newCompleted = new Set(completedDocuments);
    if (newCompleted.has(documentId)) {
      newCompleted.delete(documentId);
    } else {
      newCompleted.add(documentId);
    }
    
    setCompletedDocuments(newCompleted);
    localStorage.setItem(`course-progress-documents-${id}`, JSON.stringify([...newCompleted]));
    
    toast.success(newCompleted.has(documentId) ? 'Document marked as complete!' : 'Document marked as incomplete.');
  };

  const openVideoTab = (videoUrl: string, videoTitle: string, videoDescription: string) => {
    setSelectedContent({ 
      type: 'video', 
      url: videoUrl, 
      title: videoTitle, 
      description: videoDescription 
    });
    setActiveTab('video');
    toast(`Now watching: ${videoTitle}`);
  };

  const openDocumentTab = (documentUrl: string, documentTitle: string, documentDescription: string) => {
    setSelectedContent({ 
      type: 'document', 
      url: documentUrl, 
      title: documentTitle, 
      description: documentDescription 
    });
    setActiveTab('document');
    toast(`Now viewing: ${documentTitle}`);
  };

  const createTavusConversation = async (agentId: string, replicaId: string, conversationalContext: string) => {
    setCreatingConversation(agentId);
    
    try {
      if (!replicaId || replicaId.trim() === '') {
        toast.error('AI assistant configuration incomplete: Replica ID missing. Please contact support.');
        setCreatingConversation(null);
        return;
      }

      if (!conversationalContext || conversationalContext.trim() === '') {
        toast.error('AI assistant configuration incomplete: Conversational context missing. Please contact support.');
        setCreatingConversation(null);
        return;
      }
      
      const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
      if (!tavusApiKey || tavusApiKey.trim() === '' || tavusApiKey === 'your-tavus-api-key') {
        toast.error('Tavus API key is not configured. Please check your environment variables or contact support.');
        setCreatingConversation(null);
        return;
      }
      
      toast.loading('Starting AI conversation...');

      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey
        },
        body: JSON.stringify({
          replica_id: replicaId,
          conversational_context: conversationalContext,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Tavus API error response:', errorData);
        throw new Error(`Tavus API call failed with status ${response.status}: ${errorData.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (data.conversation_url) {
        toast.dismiss();
        window.open(data.conversation_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        toast.success('Conversation started successfully! Please check the new pop-up window.');
      } else {
        toast.dismiss();
        throw new Error('No conversation URL received from Tavus API.');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Failed to create Tavus conversation:', error);
      toast.error(`Failed to start conversation: ${(error as Error).message || 'Please check console for details.'}`);
    } finally {
      setCreatingConversation(null);
    }
  };

  const handleAgentChat = (agentId: string, replicaId: string, conversationalContext: string) => {
    createTavusConversation(agentId, replicaId, conversationalContext);
  };

  const backToContent = () => {
    setActiveTab('content');
    setSelectedContent(null);
    toast('Back to course content.');
  };

  const refreshCourse = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(`course-${id}`)) {
          localStorage.removeItem(key);
        }
      });
      
      await loadCourse(id);
      await loadProgress(id);
      toast.success('Course content refreshed!');
    } catch (error) {
      console.error('Failed to refresh course:', error);
      toast.error('Failed to refresh course content');
    } finally {
      setLoading(false);
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-responsive-lg-enhanced font-bold text-gray-900 mb-4">Course not found</h2>
        <button
          onClick={() => navigate('/courses')}
          className="btn-responsive-enhanced bg-blue-600 text-white hover:bg-blue-700"
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
    <div className="course-enroll-layout space-y-6">
      {/* Header */}
      <div className="course-enroll-header">
        <div className="course-enroll-title-section">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-responsive-lg-enhanced font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2 text-responsive-enhanced">Enrolled Course</p>
          </div>
        </div>
        
        <div className="course-enroll-actions">
          <button
            onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
            className="btn-responsive-enhanced bg-blue-600 text-white hover:bg-blue-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge Base
          </button>
          <button
            onClick={refreshCourse}
            disabled={loading}
            className="btn-responsive-enhanced bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Content'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {activeTab !== 'content' && (
        <div className="tab-navigation">
          <div className="tab-nav-content">
            <div className="tab-back-section">
              <button
                onClick={backToContent}
                className="btn-responsive-enhanced text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course Content
              </button>
              <div className="text-responsive-lg-enhanced font-semibold text-gray-900">
                {selectedContent?.title}
              </div>
            </div>
            <button
              onClick={backToContent}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        documents={allDocuments}
        isVisible={showKnowledgeBase}
        onClose={() => setShowKnowledgeBase(false)}
        onDocumentClick={openDocumentTab}
        onToggleCompletion={toggleDocumentCompletion}
      />

      <div className="course-enroll-grid">
        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'content' && (
            <>
              {/* Course Description */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-responsive-lg-enhanced font-semibold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-700 leading-relaxed text-responsive-enhanced">{course.description}</p>
              </div>

              {/* Special Downloads */}
              <SpecialDownloadsSection
                specialDocuments={specialDocuments}
                onDocumentClick={openDocumentTab}
              />

              {/* Course Content Table */}
              <div className="content-table-enhanced">
                <div className="content-table-header">
                  <div className="content-table-title-row">
                    <h2 className="text-responsive-lg-enhanced font-semibold text-gray-900">Course Content</h2>
                    <div className="text-responsive-enhanced text-gray-600">
                      {completedVideoCount} of {totalVideos} videos, {completedDocumentCount} of {totalDocuments} documents completed
                    </div>
                  </div>
                  {totalVideos > 0 && (
                    <div className="content-progress-bar">
                      <div 
                        className="content-progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
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
                              <div className="font-medium text-gray-900 text-responsive-enhanced">
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
                                    <div className="font-medium text-gray-900 text-responsive-enhanced">
                                      {chapterIndex + 1}.{itemIndex + 1} {item.title}
                                      {item.type === 'document' && item.isSpecial && <span className="ml-2 text-xs text-green-600 font-medium">(Special)</span>}
                                    </div>
                                    {item.description && (
                                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {item.description}
                                      </div>
                                    )}
                                    {item.type === 'agent' && (
                                      <div className="text-xs text-purple-600 mt-1">
                                        AI Assistant
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 mobile-hidden">
                                <span className={`status-badge-enhanced ${
                                  item.type === 'video' ? '' : 
                                  item.type === 'document' && item.isSpecial ? 'status-special-enhanced' : 
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
                              <td className="px-6 py-4 text-responsive-enhanced text-gray-500 mobile-hidden">
                                {item.type === 'video' ? (item.duration || 'N/A') : 
                                 item.type === 'document' ? 'PDF/Doc' : 
                                 'Interactive'}
                              </td>
                              <td className="px-6 py-4">
                                {item.type === 'video' && (
                                  <button
                                    onClick={() => toggleVideoCompletion(item.id)}
                                    className={`status-badge-enhanced ${
                                      completedVideos.has(item.id) ? 'status-completed-enhanced' : 'status-pending-enhanced'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {completedVideos.has(item.id) ? 'Completed' : 'Mark Done'}
                                  </button>
                                )}
                                {item.type === 'document' && item.isSpecial && (
                                  <span className={`status-badge-enhanced ${isChapterComplete(chapter) ? 'status-completed-enhanced' : 'status-pending-enhanced'}`}>
                                    {isChapterComplete(chapter) ? 'Unlocked' : 'Locked'}
                                  </span>
                                )}
                                {item.type === 'document' && !item.isSpecial && (
                                  <button
                                    onClick={() => toggleDocumentCompletion(item.id)}
                                    className={`status-badge-enhanced ${
                                      completedDocuments.has(item.id) ? 'status-completed-enhanced' : 'status-pending-enhanced'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {completedDocuments.has(item.id) ? 'Completed' : 'Mark Done'}
                                  </button>
                                )}
                                {item.type === 'agent' && (
                                  <span className="status-badge-enhanced status-available-enhanced">
                                    Available
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {item.type === 'video' && item.url && (
                                  <button
                                    onClick={() => openVideoTab(item.url, item.title, item.description || '')}
                                    className="btn-responsive-enhanced bg-blue-600 text-white hover:bg-blue-700 text-xs"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Watch
                                  </button>
                                )}
                                {item.type === 'document' && item.url && (
                                  <button
                                    onClick={() => openDocumentTab(item.url, item.title, item.description || '')}
                                    className="btn-responsive-enhanced bg-yellow-600 text-white hover:bg-yellow-700 text-xs"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View
                                  </button>
                                )}
                                {item.type === 'agent' && (
                                  <button
                                    onClick={() => handleAgentChat(
                                      item.id,
                                      item.replicaId, 
                                      item.conversationalContext
                                    )}
                                    disabled={creatingConversation === item.id}
                                    className="btn-responsive-enhanced bg-purple-600 text-white hover:bg-purple-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Bot className="w-3 h-3 mr-1" />
                                    {creatingConversation === item.id ? 'Starting...' : 'Chat'}
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
            </>
          )}

          {/* Video Tab */}
          {activeTab === 'video' && selectedContent?.type === 'video' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={selectedContent.url}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedContent.title}
                />
              </div>
              
              {selectedContent.description && (
                <div className="text-gray-700 text-responsive-enhanced">
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p>{selectedContent.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Document Tab */}
          {activeTab === 'document' && selectedContent?.type === 'document' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <iframe
                  src={selectedContent.url}
                  className="w-full h-full"
                  title={selectedContent.title}
                />
              </div>
              
              {selectedContent.description && (
                <div className="text-gray-700 text-responsive-enhanced">
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p>{selectedContent.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <CourseOverviewSidebar
          course={course}
          totalVideos={totalVideos}
          totalDocuments={totalDocuments}
          totalAgents={totalAgents}
          progressPercentage={progressPercentage}
          selectedContent={selectedContent}
          activeTab={activeTab}
        />
      </div>

      {/* ElevenLabs Chat Widget */}
      {course?.agentId && (
        <elevenlabs-convai agent-id={course.agentId}></elevenlabs-convai>
      )}
    </div>
  );
};

export default CourseEnrollDetail;