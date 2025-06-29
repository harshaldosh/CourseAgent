import React from 'react';
import type { Course } from '../types/course';
import { Clock, Users, DollarSign } from 'lucide-react';
import { enrollmentService } from '../services/enrollment';

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
  isEnrolled: boolean;
  onEnrollClick: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, isEnrolled, onEnrollClick }) => {
  const [progress, setProgress] = React.useState(0);
  
  const totalVideos = course.chapters.reduce((acc, chapter) => acc + chapter.videos.length, 0);
  const totalDocuments = course.chapters.reduce((acc, chapter) => acc + (chapter.documents || []).filter(doc => !doc.isSpecial).length, 0);
  const totalContent = totalVideos + totalDocuments;

  React.useEffect(() => {
    if (isEnrolled && course.id) {
      calculateProgress();
    }
  }, [isEnrolled, course.id]);

  const calculateProgress = async () => {
    try {
      // Get video progress from enrollment service
      const videoProgress = await enrollmentService.getProgress(course.id);
      const completedVideos = Object.values(videoProgress).filter(Boolean).length;
      
      // Get document progress from localStorage
      const savedDocuments = localStorage.getItem(`course-progress-documents-${course.id}`);
      const completedDocuments = savedDocuments ? JSON.parse(savedDocuments).length : 0;
      
      const totalCompleted = completedVideos + completedDocuments;
      const progressPercentage = totalContent > 0 ? Math.round((totalCompleted / totalContent) * 100) : 0;
      
      setProgress(progressPercentage);
    } catch (error) {
      console.error('Failed to calculate progress:', error);
      setProgress(0);
    }
  };

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnrollClick(course.id);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(course);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="aspect-video bg-gray-200 overflow-hidden">
        <img 
          src={course.image} 
          alt={course.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{course.chapters.length} chapters</span>
          </div>
          
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{totalVideos} videos</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-primary-600 font-semibold">
            <DollarSign className="w-5 h-5 mr-1" />
            <span>${course.fees}</span>
          </div>
          
          {isEnrolled && totalContent > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{progress}%</span> complete
            </div>
          )}
        </div>

        {isEnrolled && totalContent > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={handleViewClick}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Course
          </button>
          
          <button 
            onClick={handleEnrollClick}
            disabled={isEnrolled}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              isEnrolled 
                ? 'bg-green-600 text-white cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isEnrolled ? 'Enrolled' : 'Enroll'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;