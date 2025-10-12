import React from 'react';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Download,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';

interface FileRendererProps {
  url: string;
  fileName?: string;
  className?: string;
}

const FileRenderer: React.FC<FileRendererProps> = ({
  url,
  fileName,
  className = '',
}) => {
  // Extract file name from URL if not provided
  const extractedFileName = fileName || url.split('/').pop() || 'Unknown File';

  // Get file extension
  const fileExtension = extractedFileName.split('.').pop()?.toLowerCase() || '';

  // Determine file type and icon
  const getFileIcon = () => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];

    if (imageExtensions.includes(fileExtension)) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    } else if (videoExtensions.includes(fileExtension)) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    } else if (audioExtensions.includes(fileExtension)) {
      return <FileAudio className="h-8 w-8 text-green-500" />;
    } else {
      if (fileExtension === 'pdf') {
        return <FileText className="h-8 w-8 text-red-500" />;
      }

      if (fileExtension === 'docx' || fileExtension === 'doc') {
        return <FileText className="h-8 w-8 text-blue-500" />;
      }

      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  // Check if file can be previewed in browser
  const canPreview = () => {
    const previewableExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'svg',
      'pdf',
      'txt',
    ];
    return previewableExtensions.includes(fileExtension);
  };

  // Handle file download
  const handleDownload = async () => {
    try {
      // Use file-saver for reliable cross-browser downloads
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Use file-saver's saveAs function which handles all the complexity
      saveAs(blob, extractedFileName || 'download');
    } catch (error) {
      console.error('Download failed:', error);
      
      // Fallback: try to download directly using file-saver with URL
      try {
        saveAs(url, extractedFileName || 'download');
      } catch (fallbackError) {
        console.error('File-saver fallback failed:', fallbackError);
        
        // Final fallback: open in new tab
        window.open(url, '_blank');
      }
    }
  };

  // Handle file preview
  const handlePreview = () => {
    window.open(url, '_blank');
  };

  return (
    <div
      className={`inline-flex items-center gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 ${className}`}
    >
      <div className="flex-shrink-0">{getFileIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[250px] truncate">
          {extractedFileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
          {fileExtension} file
        </p>
      </div>
      <div className="flex space-x-1">
        {canPreview() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreview}
            className="h-8 w-8 p-0"
            title="Preview file"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-8 w-8 p-0"
          title="Download file"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FileRenderer;
