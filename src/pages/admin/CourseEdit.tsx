import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight, Save, Video as VideoIcon, Bot, FileText } from 'lucide-react';
import { dbService } from '../../services/database';
import { storageService } from '../../lib/storage';
import type { Course, Chapter, Video, Agent, Document } from '../../types/course';
import FileUpload from '../../components/FileUpload';
import toast from 'react-hot-toast';
import '../../styles/course-management.css';

const CourseEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    description: '',
    agentCourseDescription: '',
    agentId: '',
    category: 'Technology',
    sponsored: false,
    fees: 0,
    courseMaterialUrl: ''
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<Map<string, File>>(new Map());
  const [documentFiles, setDocumentFiles] = useState<Map<string, File>>(new Map());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const categories = ['Technology', 'Project Management', 'Finance', 'Sustainability'] as const;

  useEffect(() => {
    if (id) {
      loadCourse(id);
    }
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      const courseData = await dbService.getCourseById(courseId);
      if (courseData) {
        setCourse(courseData);
        setFormData({
          title: courseData.title,
          image: courseData.image,
          description: courseData.description,
          agentCourseDescription: courseData.agentCourseDescription || '',
          agentId: courseData.agentId || '',
          category: courseData.category || 'Technology',
          sponsored: courseData.sponsored || false,
          fees: courseData.fees,
          courseMaterialUrl: courseData.courseMaterialUrl || ''
        });
        
        // Ensure chapters have videos, agents, and documents arrays
        const processedChapters = courseData.chapters.map(chapter => ({
          ...chapter,
          videos: chapter.videos || [],
          agents: chapter.agents || [],
          documents: chapter.documents || []
        }));
        
        setChapters(processedChapters);
        setExpandedChapters(new Set(processedChapters.map(c => c.id)));
      } else {
        toast.error('Course not found');
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
      navigate('/admin/courses');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'fees' ? parseFloat(value) || 0 : value
    }));
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      videos: [],
      agents: [],
      documents: []
    };
    setChapters(prev => [...prev, newChapter]);
    setExpandedChapters(prev => new Set([...prev, newChapter.id]));
  };

  const updateChapter = (chapterId: string, field: keyof Chapter, value: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
    ));
  };

  const removeChapter = (chapterId: string) => {
    setChapters(prev => prev.filter(chapter => chapter.id !== chapterId));
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      newSet.delete(chapterId);
      return newSet;
    });
    // Remove files for this chapter
    const newVideoFiles = new Map(videoFiles);
    const newDocumentFiles = new Map(documentFiles);
    chapters.find(c => c.id === chapterId)?.videos.forEach(video => {
      newVideoFiles.delete(video.id);
    });
    chapters.find(c => c.id === chapterId)?.documents?.forEach(document => {
      newDocumentFiles.delete(document.id);
    });
    setVideoFiles(newVideoFiles);
    setDocumentFiles(newDocumentFiles);
  };

  const addVideo = (chapterId: string) => {
    const newVideo: Video = {
      id: crypto.randomUUID(),
      title: '',
      url: '',
      duration: '',
      description: '',
      type: 'video'
    };
    
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, videos: [...(chapter.videos || []), newVideo] }
        : chapter
    ));
  };

  const addAgent = (chapterId: string) => {
    const newAgent: Agent = {
      id: crypto.randomUUID(),
      title: '',
      replicaId: '',
      conversationalContext: '',
      description: '',
      type: 'agent'
    };
    
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, agents: [...(chapter.agents || []), newAgent] }
        : chapter
    ));
  };

  const addDocument = (chapterId: string) => {
    const newDocument: Document = {
      id: crypto.randomUUID(),
      title: '',
      url: '',
      description: '',
      isSpecial: false,
      type: 'document'
    };
    
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, documents: [...(chapter.documents || []), newDocument] }
        : chapter
    ));
  };

  const updateVideo = (chapterId: string, videoId: string, field: keyof Video, value: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            videos: (chapter.videos || []).map(video => 
              video.id === videoId ? { ...video, [field]: value } : video
            )
          }
        : chapter
    ));
  };

  const updateAgent = (chapterId: string, agentId: string, field: keyof Agent, value: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            agents: (chapter.agents || []).map(agent => 
              agent.id === agentId ? { ...agent, [field]: value } : agent
            )
          }
        : chapter
    ));
  };

  const updateDocument = (chapterId: string, documentId: string, field: keyof Document, value: string | boolean) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            documents: (chapter.documents || []).map(document => 
              document.id === documentId ? { ...document, [field]: value } : document
            )
          }
        : chapter
    ));
  };

  const removeVideo = (chapterId: string, videoId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, videos: (chapter.videos || []).filter(video => video.id !== videoId) }
        : chapter
    ));
    const newVideoFiles = new Map(videoFiles);
    newVideoFiles.delete(videoId);
    setVideoFiles(newVideoFiles);
  };

  const removeAgent = (chapterId: string, agentId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, agents: (chapter.agents || []).filter(agent => agent.id !== agentId) }
        : chapter
    ));
  };

  const removeDocument = (chapterId: string, documentId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, documents: (chapter.documents || []).filter(document => document.id !== documentId) }
        : chapter
    ));
    const newDocumentFiles = new Map(documentFiles);
    newDocumentFiles.delete(documentId);
    setDocumentFiles(newDocumentFiles);
  };

  const handleVideoFileSelect = (videoId: string, file: File) => {
    const newVideoFiles = new Map(videoFiles);
    newVideoFiles.set(videoId, file);
    setVideoFiles(newVideoFiles);
  };

  const handleVideoFileRemove = (videoId: string) => {
    const newVideoFiles = new Map(videoFiles);
    newVideoFiles.delete(videoId);
    setVideoFiles(newVideoFiles);
  };

  const handleDocumentFileSelect = (documentId: string, file: File) => {
    const newDocumentFiles = new Map(documentFiles);
    newDocumentFiles.set(documentId, file);
    setDocumentFiles(newDocumentFiles);
  };

  const handleDocumentFileRemove = (documentId: string) => {
    const newDocumentFiles = new Map(documentFiles);
    newDocumentFiles.delete(documentId);
    setDocumentFiles(newDocumentFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.agentCourseDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!imageFile && !formData.image) {
      toast.error('Please provide a course image');
      return;
    }

    setLoading(true);
    
    try {
      let imageUrl = formData.image;
      let materialUrl = formData.courseMaterialUrl;
      
      // Upload image if file is selected
      if (imageFile && id) {
        imageUrl = await storageService.uploadCourseImage(imageFile, id);
      }
      
      // Upload course material if file is selected
      if (materialFile && id) {
        materialUrl = await storageService.uploadCourseMaterial(materialFile, id);
      }

      // Upload files and update URLs
      const updatedChapters = await Promise.all(
        chapters.map(async (chapter) => {
          const updatedVideos = await Promise.all(
            (chapter.videos || []).map(async (video) => {
              const videoFile = videoFiles.get(video.id);
              if (videoFile && id) {
                const videoUrl = await storageService.uploadVideo(videoFile, id, chapter.id);
                return { ...video, url: videoUrl };
              }
              return video;
            })
          );

          const updatedDocuments = await Promise.all(
            (chapter.documents || []).map(async (document) => {
              const documentFile = documentFiles.get(document.id);
              if (documentFile && id) {
                const documentUrl = await storageService.uploadCourseMaterial(documentFile, id);
                return { ...document, url: documentUrl };
              }
              return document;
            })
          );

          return { 
            ...chapter, 
            videos: updatedVideos,
            documents: updatedDocuments,
            agents: chapter.agents || []
          };
        })
      );
      
      if (id) {
        await dbService.updateCourse(id, {
          ...formData,
          image: imageUrl,
          courseMaterialUrl: materialUrl,
          chapters: updatedChapters
        });
        
        toast.success('Course updated successfully!');
        navigate(`/admin/courses/${id}`);
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      toast.error('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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

  return (
    <div className="course-edit-container space-y-6">
      <div className="course-edit-header">
        <button
          onClick={() => navigate(`/admin/courses/${id}`)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg self-start"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="course-edit-title">Edit Course</h1>
          <p className="course-edit-subtitle">Update course information, chapters, videos, agents, and documents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="course-info-section">
          <h2 className="course-info-title">Course Information</h2>
          
          <div className="course-info-grid">
            <div className="course-info-field">
              <label className="course-info-label">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="course-info-input"
                required
              />
            </div>
            
            <div className="course-info-field">
              <label className="course-info-label">
                Course Fees ($) *
              </label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="course-info-input"
                required
              />
            </div>

            <div className="course-info-field">
              <label className="course-info-label">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="course-info-input"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="course-info-field">
              <label className="course-info-label">
                Agent ID (Read Only)
              </label>
              <input
                type="text"
                name="agentId"
                value={formData.agentId}
                readOnly
                className="course-info-input course-info-readonly"
                placeholder="No agent ID assigned"
              />
            </div>

            <div className="course-info-checkbox-container">
              <input
                type="checkbox"
                name="sponsored"
                id="sponsored"
                checked={formData.sponsored}
                onChange={handleInputChange}
                className="course-info-checkbox"
              />
              <label htmlFor="sponsored" className="course-info-checkbox-label">
                Sponsored Course
              </label>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="course-info-label">
              Course Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="course-info-textarea"
              required
            />
          </div>

          <div className="mt-6">
            <label className="course-info-label">
              Agent Course Description *
            </label>
            <textarea
              name="agentCourseDescription"
              value={formData.agentCourseDescription}
              onChange={handleInputChange}
              rows={6}
              placeholder="Detailed description for AI agents to understand the course content and context..."
              className="course-info-textarea"
              required
            />
          </div>

          <div className="mt-6 form-grid">
            <div>
              <FileUpload
                label="Course Image"
                description="Upload a new image or keep current one"
                accept="image/*"
                maxSize={5}
                onFileSelect={setImageFile}
                onFileRemove={() => setImageFile(null)}
                currentFile={formData.image}
                preview={true}
              />
              
              <div className="mt-3">
                <label className="course-info-label">
                  Or provide image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="course-info-input"
                />
              </div>
            </div>

            <div>
              <FileUpload
                label="Course Materials"
                description="Upload new materials or keep current ones"
                accept=".pdf,.zip,.doc,.docx,.ppt,.pptx"
                maxSize={50}
                onFileSelect={setMaterialFile}
                onFileRemove={() => setMaterialFile(null)}
                currentFile={formData.courseMaterialUrl}
              />
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="chapter-management-section">
          <div className="chapter-management-header">
            <h2 className="chapter-management-title">Chapters, Videos, Agents & Documents</h2>
            <button
              type="button"
              onClick={addChapter}
              className="chapter-add-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </button>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>No chapters added yet. Click "Add Chapter" to get started.</p>
            </div>
          ) : (
            <div className="chapter-list">
              {chapters.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="chapter-item">
                  <div className="chapter-item-header">
                    <div className="chapter-item-title-row">
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapter.id)}
                        className="chapter-item-title-button"
                      >
                        {expandedChapters.has(chapter.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="chapter-item-title-text">
                          Chapter {chapterIndex + 1}: {chapter.title || 'Untitled Chapter'}
                        </span>
                        <span className="chapter-item-stats">
                          ({(chapter.videos || []).length}v, {(chapter.agents || []).length}a, {(chapter.documents || []).length}d)
                        </span>
                      </button>
                      
                      <div className="chapter-item-actions">
                        <button
                          type="button"
                          onClick={() => addVideo(chapter.id)}
                          className="chapter-action-button video"
                          title="Add Video"
                        >
                          <VideoIcon className="w-3 h-3 mr-1" />
                          Video
                        </button>
                        <button
                          type="button"
                          onClick={() => addAgent(chapter.id)}
                          className="chapter-action-button agent"
                          title="Add Agent"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          Agent
                        </button>
                        <button
                          type="button"
                          onClick={() => addDocument(chapter.id)}
                          className="chapter-action-button document"
                          title="Add Document"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Document
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChapter(chapter.id)}
                          className="chapter-action-button delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedChapters.has(chapter.id) && (
                    <div className="chapter-item-content">
                      <div className="chapter-form-grid">
                        <div className="chapter-form-field">
                          <label className="chapter-form-label">
                            Chapter Title *
                          </label>
                          <input
                            type="text"
                            placeholder={`Chapter ${chapterIndex + 1} Title`}
                            value={chapter.title}
                            onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                            className="chapter-form-input"
                          />
                        </div>
                        
                        <div className="chapter-form-field">
                          <label className="chapter-form-label">
                            Chapter Description
                          </label>
                          <textarea
                            placeholder="Brief description of this chapter"
                            value={chapter.description}
                            onChange={(e) => updateChapter(chapter.id, 'description', e.target.value)}
                            rows={2}
                            className="chapter-form-textarea"
                          />
                        </div>
                      </div>

                      <div className="content-sections">
                        {/* Videos */}
                        {(chapter.videos || []).length > 0 && (
                          <div className="content-section">
                            <div className="content-section-header">
                              <h4 className="content-section-title">
                                <VideoIcon className="w-4 h-4 mr-2" />
                                Videos ({(chapter.videos || []).length})
                              </h4>
                            </div>
                            <div className="content-items-list">
                              {(chapter.videos || []).map((video, videoIndex) => (
                                <div key={video.id} className="content-item-card video-card">
                                  <div className="content-item-header">
                                    <span className="text-sm font-medium text-gray-700">
                                      Video {videoIndex + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeVideo(chapter.id, video.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="content-item-fields">
                                    <input
                                      type="text"
                                      placeholder="Video Title"
                                      value={video.title}
                                      onChange={(e) => updateVideo(chapter.id, video.id, 'title', e.target.value)}
                                      className="chapter-form-input"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Duration (e.g., 10:30)"
                                      value={video.duration || ''}
                                      onChange={(e) => updateVideo(chapter.id, video.id, 'duration', e.target.value)}
                                      className="chapter-form-input"
                                    />
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <label className="chapter-form-label">
                                        Video File or URL
                                      </label>
                                      <FileUpload
                                        label=""
                                        description="Upload video file (MP4, MOV, AVI) or provide URL below"
                                        accept="video/*"
                                        maxSize={500}
                                        onFileSelect={(file) => handleVideoFileSelect(video.id, file)}
                                        onFileRemove={() => handleVideoFileRemove(video.id)}
                                        currentFile={videoFiles.has(video.id) ? videoFiles.get(video.id)?.name : ''}
                                      />
                                    </div>
                                    
                                    <input
                                      type="url"
                                      placeholder="Or provide video URL (YouTube, Vimeo, etc.)"
                                      value={video.url}
                                      onChange={(e) => updateVideo(chapter.id, video.id, 'url', e.target.value)}
                                      className="chapter-form-input"
                                    />
                                  </div>
                                  
                                  <textarea
                                    placeholder="Video description (optional)"
                                    value={video.description || ''}
                                    onChange={(e) => updateVideo(chapter.id, video.id, 'description', e.target.value)}
                                    rows={2}
                                    className="chapter-form-textarea"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {(chapter.documents || []).length > 0 && (
                          <div className="content-section">
                            <div className="content-section-header">
                              <h4 className="content-section-title">
                                <FileText className="w-4 h-4 mr-2" />
                                Documents ({(chapter.documents || []).length})
                              </h4>
                            </div>
                            <div className="content-items-list">
                              {(chapter.documents || []).map((document, docIndex) => (
                                <div key={document.id} className={`content-item-card ${document.isSpecial ? 'special-document-card' : 'document-card'}`}>
                                  <div className="content-item-header">
                                    <span className="text-sm font-medium text-gray-700">
                                      Document {docIndex + 1} {document.isSpecial && '(Special)'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(chapter.id, document.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="content-item-fields">
                                    <input
                                      type="text"
                                      placeholder="Document Title"
                                      value={document.title}
                                      onChange={(e) => updateDocument(chapter.id, document.id, 'title', e.target.value)}
                                      className="chapter-form-input"
                                    />
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        id={`special-${document.id}`}
                                        checked={document.isSpecial}
                                        onChange={(e) => updateDocument(chapter.id, document.id, 'isSpecial', e.target.checked)}
                                        className="course-info-checkbox"
                                      />
                                      <label htmlFor={`special-${document.id}`} className="course-info-checkbox-label">
                                        Special Document (unlocks when chapter is complete)
                                      </label>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <label className="chapter-form-label">
                                        Document File or URL
                                      </label>
                                      <FileUpload
                                        label=""
                                        description="Upload document file (PDF, DOC, etc.) or provide URL below"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                        maxSize={50}
                                        onFileSelect={(file) => handleDocumentFileSelect(document.id, file)}
                                        onFileRemove={() => handleDocumentFileRemove(document.id)}
                                        currentFile={documentFiles.has(document.id) ? documentFiles.get(document.id)?.name : ''}
                                      />
                                    </div>
                                    
                                    <input
                                      type="url"
                                      placeholder="Or provide document URL"
                                      value={document.url}
                                      onChange={(e) => updateDocument(chapter.id, document.id, 'url', e.target.value)}
                                      className="chapter-form-input"
                                    />
                                  </div>
                                  
                                  <textarea
                                    placeholder="Document description (optional)"
                                    value={document.description || ''}
                                    onChange={(e) => updateDocument(chapter.id, document.id, 'description', e.target.value)}
                                    rows={2}
                                    className="chapter-form-textarea"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Agents */}
                        {(chapter.agents || []).length > 0 && (
                          <div className="content-section">
                            <div className="content-section-header">
                              <h4 className="content-section-title">
                                <Bot className="w-4 h-4 mr-2" />
                                Agents ({(chapter.agents || []).length})
                              </h4>
                            </div>
                            <div className="content-items-list">
                              {(chapter.agents || []).map((agent, agentIndex) => (
                                <div key={agent.id} className="content-item-card agent-card">
                                  <div className="content-item-header">
                                    <span className="text-sm font-medium text-gray-700">
                                      Agent {agentIndex + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeAgent(chapter.id, agent.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="content-item-fields">
                                    <input
                                      type="text"
                                      placeholder="Agent Title"
                                      value={agent.title}
                                      onChange={(e) => updateAgent(chapter.id, agent.id, 'title', e.target.value)}
                                      className="chapter-form-input"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Replica ID"
                                      value={agent.replicaId}
                                      onChange={(e) => updateAgent(chapter.id, agent.id, 'replicaId', e.target.value)}
                                      className="chapter-form-input"
                                    />
                                  </div>
                                  
                                  <textarea
                                    placeholder="Conversational Context"
                                    value={agent.conversationalContext}
                                    onChange={(e) => updateAgent(chapter.id, agent.id, 'conversationalContext', e.target.value)}
                                    rows={3}
                                    className="chapter-form-textarea"
                                  />
                                  
                                  <textarea
                                    placeholder="Agent description (optional)"
                                    value={agent.description || ''}
                                    onChange={(e) => updateAgent(chapter.id, agent.id, 'description', e.target.value)}
                                    rows={2}
                                    className="chapter-form-textarea"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(chapter.videos || []).length === 0 && (chapter.agents || []).length === 0 && (chapter.documents || []).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No content added to this chapter yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(`/admin/courses/${id}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseEdit;