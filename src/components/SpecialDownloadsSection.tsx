import React from 'react';
import { FileText, Download, Lock, Unlock } from 'lucide-react';

interface SpecialDownload {
  id: string;
  title: string;
  url: string;
  description?: string;
  chapterTitle: string;
  chapterIndex: number;
  isUnlocked: boolean;
}

interface SpecialDownloadsSectionProps {
  specialDocuments: SpecialDownload[];
  onDocumentClick: (url: string, title: string, description: string) => void;
}

const SpecialDownloadsSection: React.FC<SpecialDownloadsSectionProps> = ({
  specialDocuments,
  onDocumentClick
}) => {
  if (specialDocuments.length === 0) return null;

  const unlockedCount = specialDocuments.filter(doc => doc.isUnlocked).length;
  const totalCount = specialDocuments.length;
  
  const getSectionClass = () => {
    if (unlockedCount === 0) return 'special-downloads-enhanced special-downloads-locked';
    if (unlockedCount === totalCount) return 'special-downloads-enhanced special-downloads-unlocked';
    return 'special-downloads-enhanced special-downloads-mixed';
  };

  const getStatusIcon = () => {
    if (unlockedCount === 0) return <Lock className="w-5 h-5" />;
    if (unlockedCount === totalCount) return <Unlock className="w-5 h-5" />;
    return <Unlock className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (unlockedCount === 0) return 'All documents locked';
    if (unlockedCount === totalCount) return 'All documents unlocked';
    return `${unlockedCount} of ${totalCount} unlocked`;
  };

  return (
    <div className={getSectionClass()}>
      <div className="special-downloads-header">
        <h2 className="text-responsive-lg-enhanced font-semibold">Special Downloads</h2>
        <div className="special-downloads-status">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      <p className="text-responsive-enhanced opacity-90 mb-4">
        These documents become available when you complete their respective chapters.
      </p>
      
      <div className="downloads-grid-enhanced">
        {specialDocuments.map((doc) => (
          <div
            key={doc.id}
            className={`download-item-enhanced ${doc.isUnlocked ? 'unlocked' : 'locked'}`}
          >
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-medium text-responsive-enhanced mb-1">{doc.title}</h3>
            <p className="text-xs opacity-75 mb-2">
              Chapter {doc.chapterIndex}: {doc.chapterTitle}
            </p>
            
            {doc.isUnlocked ? (
              <button
                onClick={() => onDocumentClick(doc.url, doc.title, doc.description || '')}
                className="inline-flex items-center text-responsive-enhanced font-medium hover:underline transition-all duration-200"
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
  );
};

export default SpecialDownloadsSection;