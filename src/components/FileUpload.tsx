import React, { useRef, useState } from 'react';
import { Upload, X, File } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: string;
  label: string;
  description?: string;
  preview?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = "*/*",
  maxSize = 10,
  currentFile,
  label,
  description,
  preview = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }
    
    setSelectedFileName(file.name);
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFileName('');
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = accept.includes('image');
  const hasFile = selectedFileName || currentFile;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : hasFile
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {hasFile ? (
          <div className="text-center">
            {preview && isImage && currentFile && (
              <div className="mb-4">
                <img
                  src={currentFile}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded-lg object-cover"
                />
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-2">
              <File className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {selectedFileName || 'File uploaded'}
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 text-red-600 hover:bg-red-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-primary-600 hover:text-primary-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max file size: {maxSize}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;