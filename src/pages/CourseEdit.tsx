import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight, Save, Video as VideoIcon, Bot } from 'lucide-react';
import { dbService } from '../services/database';
import { storageService } from '../lib/storage';
import type { Course, Chapter, Video, Agent, Document } from '../types/course';
import FileUpload from '../components/FileUpload';
import toast from 'react-hot-toast';

type CourseFormData = {
  title: string;
  image: string;
  description: string;
  agentCourseDescription: string;
  category: Course['category'];
  sponsored: boolean;
  fees: number;
  courseMaterialUrl: string;
};

const CourseEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    image: '',
    description: '',
    agentCourseDescription: '',
    category: 'Technology',
    sponsored: false,
    fees: 0,
    courseMaterialUrl: ''
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<Map<string, File>>(new Map());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const categories = ['Technology', 'Project Management', 'Finance', 'Sustainability'] as const;
  const isAdmin = import.meta.env.VITE_ADMIN_LOGIN === 'true';

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied');
      navigate('/courses');
      return;
    }

    if (id) {
      loadCourse(id);
    }
  }, [id, isAdmin, navigate]);

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
          category: courseData.category || 'Technology',
          sponsored: courseData.sponsored || false,
          fees: courseData.fees,
          courseMaterialUrl: courseData.courseMaterialUrl || ''
        });
        
        // Ensure chapters have both videos and agents arrays
        const processedChapters = courseData.chapters.map(chapter => ({
          ...chapter,
          videos: chapter.videos || [],
          agents: chapter.agents || []
        }));
        
        setChapters(processedChapters);
        // Expand all chapters by default
        setExpandedChapters(new Set(processedChapters.map(c => c.id)));
      } else {
        toast.error('Course not found');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
      navigate('/courses');
    } finally {
      setInitialLoading(false);
    }
  };

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
      documents: [] //Harshal

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
    // Remove video files for this chapter
    const newVideoFiles = new Map(videoFiles);
    chapters.find(c => c.id === chapterId)?.videos.forEach(video => {
      newVideoFiles.delete(video.id);
    });
    setVideoFiles(newVideoFiles);
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

  const removeVideo = (chapterId: string, videoId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, videos: (chapter.videos || []).filter(video => video.id !== videoId) }
        : chapter
    ));
    // Remove video file
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

      // Upload video files and update URLs
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
          return { 
            ...chapter, 
            videos: updatedVideos,
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
        navigate(`/courses/${id}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => navigate(`/courses/${id}`)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg self-start"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Course</h1>
          <p className="text-gray-600 mt-2">Update course information, chapters, videos, and agents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Course Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sponsored" className="ml-2 block text-sm text-gray-900">
                Sponsored Course
              </label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <FileUpload
                label="Course Image *"
                description="Upload a new image or keep current"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <FileUpload
                label="Course Materials (Optional)"
                description="Upload new materials or keep current"
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
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Chapters, Videos & Agents</h2>
            <button
              type="button"
              onClick={addChapter}
              className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </button>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No chapters added yet. Click "Add Chapter" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="border border-gray-200 rounded-lg">
                  <div className="p-4 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
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
                        <span className="font-medium text-gray-900 truncate">
                          Chapter {chapterIndex + 1}: {chapter.title || 'Untitled Chapter'}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({(chapter.videos || []).length} videos, {(chapter.agents || []).length} agents)
                        </span>
                      </button>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => addVideo(chapter.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                          title="Add Video"
                        >
                          <VideoIcon className="w-4 h-4 mr-1" />
                          Video
                        </button>
                        <button
                          type="button"
                          onClick={() => addAgent(chapter.id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors flex items-center"
                          title="Add Agent"
                        >
                          <Bot className="w-4 h-4 mr-1" />
                          Agent
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChapter(chapter.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedChapters.has(chapter.id) && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chapter Title *
                          </label>
                          <input
                            type="text"
                            placeholder={`Chapter ${chapterIndex + 1} Title`}
                            value={chapter.title}
                            onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Videos */}
                      {(chapter.videos || []).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <VideoIcon className="w-4 h-4 mr-2" />
                            Videos ({(chapter.videos || []).length})
                          </h4>
                          {(chapter.videos || []).map((video, videoIndex) => (
                            <div key={video.id} className="p-4 bg-blue-50 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
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
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="Video Title"
                                  value={video.title}
                                  onChange={(e) => updateVideo(chapter.id, video.id, 'title', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Duration (e.g., 10:30)"
                                  value={video.duration || ''}
                                  onChange={(e) => updateVideo(chapter.id, video.id, 'duration', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                              </div>
                              
                              <textarea
                                placeholder="Video description (optional)"
                                value={video.description || ''}
                                onChange={(e) => updateVideo(chapter.id, video.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Agents */}
                      {(chapter.agents || []).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Bot className="w-4 h-4 mr-2" />
                            Agents ({(chapter.agents || []).length})
                          </h4>
                          {(chapter.agents || []).map((agent, agentIndex) => (
                            <div key={agent.id} className="p-4 bg-purple-50 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
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
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="Agent Title"
                                  value={agent.title}
                                  onChange={(e) => updateAgent(chapter.id, agent.id, 'title', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Replica ID"
                                  value={agent.replicaId}
                                  onChange={(e) => updateAgent(chapter.id, agent.id, 'replicaId', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                              </div>
                              
                              <textarea
                                placeholder="Conversational Context"
                                value={agent.conversationalContext}
                                onChange={(e) => updateAgent(chapter.id, agent.id, 'conversationalContext', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                              />
                              
                              <textarea
                                placeholder="Agent description (optional)"
                                value={agent.description || ''}
                                onChange={(e) => updateAgent(chapter.id, agent.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {(chapter.videos || []).length === 0 && (chapter.agents || []).length === 0 && (
                        <p className="text-sm text-gray-500 italic">No videos or agents added to this chapter yet.</p>
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
            onClick={() => navigate(`/courses/${id}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
// PageResponsiveChecked