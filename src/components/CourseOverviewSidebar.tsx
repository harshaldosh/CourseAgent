import React from 'react';
import { DollarSign, Clock, Play, FileText, Bot, Check, Download } from 'lucide-react';

interface CourseOverviewSidebarProps {
  course: {
    fees: number;
    chapters: any[];
    courseMaterialUrl?: string;
  };
  totalVideos: number;
  totalDocuments: number;
  totalAgents: number;
  progressPercentage: number;
  selectedContent?: {
    type: string;
    title: string;
  } | null;
  activeTab: string;
}

const CourseOverviewSidebar: React.FC<CourseOverviewSidebarProps> = ({
  course,
  totalVideos,
  totalDocuments,
  totalAgents,
  progressPercentage,
  selectedContent,
  activeTab
}) => {
  return (
    <div className="course-sidebar">
      {/* Course Stats */}
      <div className="course-overview-card">
        <h3 className="text-responsive-lg-enhanced font-semibold text-gray-900 mb-4">
          Course Overview
        </h3>
        
        <div className="overview-stats">
          <div className="overview-stat-row">
            <div className="overview-stat-label">
              <DollarSign className="w-5 h-5 mr-2" />
              <span>Price</span>
            </div>
            <span className="overview-stat-value text-blue-600">
              ${course.fees}
            </span>
          </div>
          
          <div className="overview-stat-row">
            <div className="overview-stat-label">
              <Clock className="w-5 h-5 mr-2" />
              <span>Chapters</span>
            </div>
            <span className="overview-stat-value">
              {course.chapters.length}
            </span>
          </div>
          
          <div className="overview-stat-row">
            <div className="overview-stat-label">
              <Play className="w-5 h-5 mr-2" />
              <span>Videos</span>
            </div>
            <span className="overview-stat-value">
              {totalVideos}
            </span>
          </div>

          <div className="overview-stat-row">
            <div className="overview-stat-label">
              <FileText className="w-5 h-5 mr-2" />
              <span>Documents</span>
            </div>
            <span className="overview-stat-value">
              {totalDocuments}
            </span>
          </div>

          <div className="overview-stat-row">
            <div className="overview-stat-label">
              <Bot className="w-5 h-5 mr-2" />
              <span>AI Assistants</span>
            </div>
            <span className="overview-stat-value">
              {totalAgents}
            </span>
          </div>

          <div className="overview-stat-row">
            <div className="overview-stat-label">
              <Check className="w-5 h-5 mr-2" />
              <span>Progress</span>
            </div>
            <span className="overview-stat-value text-green-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>

        {course.courseMaterialUrl && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <a
              href={course.courseMaterialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-responsive-enhanced bg-green-600 text-white hover:bg-green-700 w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Course Materials
            </a>
          </div>
        )}
      </div>

      {/* Current Activity */}
      {activeTab !== 'content' && selectedContent && (
        <div className="current-activity-card">
          <h3 className="text-responsive-lg-enhanced font-semibold text-gray-900 mb-4">
            Current Activity
          </h3>
          <div className="current-activity-content">
            {selectedContent.type === 'video' ? (
              <Play className="current-activity-icon text-blue-600" />
            ) : selectedContent.type === 'document' ? (
              <FileText className="current-activity-icon text-yellow-600" />
            ) : (
              <Bot className="current-activity-icon text-purple-600" />
            )}
            <div className="current-activity-info">
              <div className="current-activity-title">
                {selectedContent.title}
              </div>
              <div className="current-activity-type">
                {selectedContent.type}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseOverviewSidebar;