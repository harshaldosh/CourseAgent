import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight, Video as VideoIcon, Bot, FileText } from 'lucide-react';
import { dbService } from '../services/database';
import { storageService } from '../lib/storage';
import type { Chapter, Video, Agent, Document, Course } from '../types/course';
import FileUpload from '../components/FileUpload';
import toast from 'react-hot-toast';
import '../styles/course-management.css';

type CourseFormData = {
  title: string;
  image: string;
  description: string;
  agentCourseDescription: string;
  agentId: string;
  category: Course['category'];
  sponsored: boolean;
  fees: number;
  courseMaterialUrl: string;
};

const CourseAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
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

  const categories = ['Technology', 'Project Management', 'Finance', 'Sustainability'] ;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'fees' ? parseFloat(value) || 0 :
               name === 'category' ? value as Course['category'] : value
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
    chapters.find(c => c.id === chapterId)?.documents.forEach(document => {
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
        ? { ...chapter, videos: [...chapter.videos, newVideo] }
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
        ? { ...chapter, agents: [...chapter.agents, newAgent] }
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
        ? { ...chapter, documents: [...chapter.documents, newDocument] }
        : chapter
    ));
  };

  const updateVideo = (chapterId: string, videoId: string, field: keyof Video, value: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            videos: chapter.videos.map(video => 
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
            agents: chapter.agents.map(agent => 
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
            documents: chapter.documents.map(document => 
              document.id === documentId ? { ...document, [field]: value } : document
            )
          }
        : chapter
    ));
  };

  const removeVideo = (chapterId: string, videoId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, videos: chapter.videos.filter(video => video.id !== videoId) }
        : chapter
    ));
    const newVideoFiles = new Map(videoFiles);
    newVideoFiles.delete(videoId);
    setVideoFiles(newVideoFiles);
  };

  const removeAgent = (chapterId: string, agentId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, agents: chapter.agents.filter(agent => agent.id !== agentId) }
        : chapter
    ));
  };

  const removeDocument = (chapterId: string, documentId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, documents: chapter.documents.filter(document => document.id !== documentId) }
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
      
      // Generate a temporary course ID for file uploads
      const tempCourseId = crypto.randomUUID();
      
      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await storageService.uploadCourseImage(imageFile, tempCourseId);
      }
      
      // Upload course material if file is selected
      if (materialFile) {
        materialUrl = await storageService.uploadCourseMaterial(materialFile, tempCourseId);
      }

      // Upload files and update URLs
      const updatedChapters = await Promise.all(
        chapters.map(async (chapter) => {
          const updatedVideos = await Promise.all(
            chapter.videos.map(async (video) => {
              const videoFile = videoFiles.get(video.id);
              if (videoFile) {
                const videoUrl = await storageService.uploadVideo(videoFile, tempCourseId, chapter.id);
                return { ...video, url: videoUrl };
              }
              return video;
            })
          );

          const updatedDocuments = await Promise.all(
            chapter.documents.map(async (document) => {
              const documentFile = documentFiles.get(document.id);
              if (documentFile) {
                const documentUrl = await storageService.uploadCourseMaterial(documentFile, tempCourseId);
                return { ...document, url: documentUrl };
              }
              return document;
            })
          );

          return { 
            ...chapter, 
            videos: updatedVideos,
            documents: updatedDocuments
          };
        })
      );
      
      await dbService.addCourse({
        ...formData,
        image: imageUrl,
        courseMaterialUrl: materialUrl,
        chapters: updatedChapters
      });
      
      toast.success('Course created successfully!');
      navigate('/admin/courses');
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => navigate('/admin/courses')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg self-start"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-responsive-lg font-bold text-gray-900">Add New Course</h1>
          <p className="text-gray-600 mt-2 text-responsive-sm">Create a new course with chapters, videos, agents, and documents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md card-responsive">
          <h2 className="text-responsive-base font-semibold text-gray-900 mb-6">Course Information</h2>
          
          <div className="form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Fees ($) *
              </label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="sponsored"
                id="sponsored"
                checked={formData.sponsored}
                onChange={handleInputChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="sponsored" className="ml-2 block text-sm text-gray-900">
                Sponsored Course
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent ID (Optional)
              </label>
              <input
                type="text"
                name="agentId"
                value={formData.agentId}
                onChange={handleInputChange}
                placeholder="Enter ElevenLabs agent ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                ElevenLabs agent ID for AI chat widget integration
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
              required
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Course Description *
            </label>
            <textarea
              name="agentCourseDescription"
              value={formData.agentCourseDescription}
              onChange={handleInputChange}
              rows={6}
              placeholder="Detailed description for AI agents to understand the course content and context..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
              required
            />
          </div>

          <div className="mt-6 form-grid">
            <div>
              <FileUpload
                label="Course Image *"
                description="Upload an image or provide a URL"
                accept="image/*"
                maxSize={5}
                onFileSelect={setImageFile}
                onFileRemove={() => setImageFile(null)}
                currentFile={formData.image}
                preview={true}
              />
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or provide image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
                />
              </div>
            </div>

            <div>
              <FileUpload
                label="Course Materials (Optional)"
                description="Upload additional course materials (PDF, ZIP, etc.)"
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
        <div className="bg-white rounded-lg shadow-md card-responsive">
          <div className="chapter-header mb-6">
            <h2 className="text-responsive-base font-semibold text-gray-900">Chapters, Videos, Agents & Documents</h2>
            <button
              type="button"
              onClick={addChapter}
              className="btn-responsive bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </button>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-responsive-sm">No chapters added yet. Click "Add Chapter" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="border border-gray-200 rounded-lg">
                  <div className="p-4 bg-gray-50 rounded-t-lg">
                    <div className="chapter-header">
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapter.id)}
                        className="flex items-center space-x-2 text-left flex-1 min-w-0"
                      >
                        {expandedChapters.has(chapter.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-900 truncate text-responsive-sm">
                          Chapter {chapterIndex + 1}: {chapter.title || 'Untitled Chapter'}
                        </span>
                      </button>
                      
                      <div className="chapter-actions">
                        <button
                          type="button"
                          onClick={() => addVideo(chapter.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
                          title="Add Video"
                        >
                          <VideoIcon className="w-3 h-3 mr-1" />
                          Video
                        </button>
                        <button
                          type="button"
                          onClick={() => addAgent(chapter.id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors flex items-center"
                          title="Add Agent"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          Agent
                        </button>
                        <button
                          type="button"
                          onClick={() => addDocument(chapter.id)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors flex items-center"
                          title="Add Document"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Document
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChapter(chapter.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedChapters.has(chapter.id) && (
                    <div className="p-4 space-y-4">
                      <div className="form-grid">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chapter Title *
                          </label>
                          <input
                            type="text"
                            placeholder={`Chapter ${chapterIndex + 1} Title`}
                            value={chapter.title}
                            onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chapter Description
                          </label>
                          <textarea
                            placeholder="Brief description of this chapter"
                            value={chapter.description}
                            onChange={(e) => updateChapter(chapter.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-responsive-sm"
                          />
                        </div>
                      </div>

                      {/* Videos */}
                      {chapter.videos.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center text-responsive-sm">
                            <VideoIcon className="w-4 h-4 mr-2" />
                            Videos
                          </h4>
                          {chapter.videos.map((video, videoIndex) => (
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
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Duration (e.g., 10:30)"
                                  value={video.duration || ''}
                                  onChange={(e) => updateVideo(chapter.id, video.id, 'duration', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                              </div>
                              
                              <textarea
                                placeholder="Video description (optional)"
                                value={video.description || ''}
                                onChange={(e) => updateVideo(chapter.id, video.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Documents */}
                      {chapter.documents.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center text-responsive-sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Documents
                          </h4>
                          {chapter.documents.map((document, docIndex) => (
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
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`special-${document.id}`}
                                    checked={document.isSpecial}
                                    onChange={(e) => updateDocument(chapter.id, document.id, 'isSpecial', e.target.checked)}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`special-${document.id}`} className="ml-2 block text-sm text-gray-900">
                                    Special Document (unlocks when chapter is complete)
                                  </label>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                              </div>
                              
                              <textarea
                                placeholder="Document description (optional)"
                                value={document.description || ''}
                                onChange={(e) => updateDocument(chapter.id, document.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Agents */}
                      {chapter.agents.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center text-responsive-sm">
                            <Bot className="w-4 h-4 mr-2" />
                            Agents
                          </h4>
                          {chapter.agents.map((agent, agentIndex) => (
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
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Replica ID"
                                  value={agent.replicaId}
                                  onChange={(e) => updateAgent(chapter.id, agent.id, 'replicaId', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                              </div>
                              
                              <textarea
                                placeholder="Conversational Context"
                                value={agent.conversationalContext}
                                onChange={(e) => updateAgent(chapter.id, agent.id, 'conversationalContext', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                              />
                              
                              <textarea
                                placeholder="Agent description (optional)"
                                value={agent.description || ''}
                                onChange={(e) => updateAgent(chapter.id, agent.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {chapter.videos.length === 0 && chapter.agents.length === 0 && chapter.documents.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No content added to this chapter yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/courses')}
            className="btn-responsive border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-responsive bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseAdd;