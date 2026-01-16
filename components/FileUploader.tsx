'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { createFileItem, getFilesFromEntry, FileItem } from '@/lib/pdfMerger';

interface FileUploaderProps {
  onFilesAdded: (files: FileItem[]) => void;
  disabled?: boolean;
}

export default function FileUploader({ onFilesAdded, disabled }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<string | null>(null);

  const processFiles = useCallback(async (fileList: File[]) => {
    const items = fileList.map(createFileItem);
    onFilesAdded(items);
  }, [onFilesAdded]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const items = e.dataTransfer.items;
    const allFiles: File[] = [];

    setScanningStatus('Scanning files...');

    // Process each dropped item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry?.();

      if (entry) {
        try {
          const files = await getFilesFromEntry(entry);
          allFiles.push(...files);
          setScanningStatus(`Found ${allFiles.length} files...`);
        } catch (err) {
          console.error('Error reading entry:', err);
        }
      } else if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) allFiles.push(file);
      }
    }

    setScanningStatus(null);
    
    if (allFiles.length > 0) {
      await processFiles(allFiles);
    }
  }, [disabled, processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await processFiles(files);
    }
    e.target.value = '';
  }, [processFiles]);

  return (
    <div
      className={`drop-zone p-12 text-center cursor-pointer ${isDragging ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.svg,.ico,.avif,.heic,.heif,.txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.log,.docx,.doc"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-4">
          <div className={`icon-circle icon-pdf float ${isDragging ? 'scale-125' : ''} transition-transform`}>
            <Upload size={24} />
          </div>
          <div className={`icon-circle icon-image float stagger-2 ${isDragging ? 'scale-125' : ''} transition-transform`}>
            <FolderOpen size={24} />
          </div>
        </div>

        {scanningStatus ? (
          <div className="text-purple-600 font-bold animate-pulse text-lg">
            ✨ {scanningStatus}
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {isDragging ? '🎯 Drop your files here!' : '📁 Drop files or folders here'}
              </h3>
              <p className="text-gray-600 font-medium">
                or click to browse • PDFs and images supported
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <span className="format-badge format-pdf text-xs">PDF</span>
              <span className="format-badge format-word text-xs">DOCX</span>
              <span className="format-badge format-image text-xs">JPG</span>
              <span className="format-badge format-image text-xs">PNG</span>
              <span className="format-badge format-text text-xs">TXT</span>
              <span className="text-xs text-gray-500">+more</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

