import React from 'react';
import { FileText, ExternalLink, Check } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  url: string;
  description?: string;
  chapterTitle: string;
  chapterIndex: number;
  isCompleted: boolean;
  isSpecial: boolean;
}

interface KnowledgeBaseModalProps {
  documents: Document[];
  isVisible: boolean;
  onClose: () => void;
  onDocumentClick: (url: string, title: string, description: string) => void;
  onToggleCompletion: (documentId: string) => void;
}

const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  documents,
  isVisible,
  onClose,
  onDocumentClick,
  onToggleCompletion
}) => {
  if (!isVisible) return null;

  return (
    <div className="knowledge-base-modal">
      <div className="knowledge-base-header">
        <h2 className="text-responsive-lg-enhanced font-semibold text-gray-900">
          Knowledge Base - All Documents
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-responsive-enhanced">
            No documents available in this course.
          </p>
        </div>
      ) : (
        <div className="knowledge-base-grid-enhanced">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className={`document-card-enhanced ${doc.isSpecial ? 'special' : ''} ${doc.isCompleted ? 'completed' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900 text-responsive-enhanced">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Chapter {doc.chapterIndex}: {doc.chapterTitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.isSpecial && (
                    <span className="status-badge-enhanced status-special-enhanced">
                      Special
                    </span>
                  )}
                  {doc.isCompleted && (
                    <span className="status-badge-enhanced status-completed-enhanced">
                      Completed
                    </span>
                  )}
                </div>
              </div>
              
              {doc.description && (
                <p className="text-responsive-enhanced text-gray-600 mb-3">
                  {doc.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onDocumentClick(doc.url, doc.title, doc.description || '')}
                  className="text-blue-600 hover:text-blue-700 text-responsive-enhanced font-medium flex items-center transition-colors"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Document
                </button>
                
                {!doc.isSpecial && (
                  <button
                    onClick={() => onToggleCompletion(doc.id)}
                    className={`status-badge-enhanced ${
                      doc.isCompleted ? 'status-completed-enhanced' : 'status-pending-enhanced'
                    }`}
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
  );
};

export default KnowledgeBaseModal;