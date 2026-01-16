'use client';

import React from 'react';
import { FileText, Image as ImageIcon, X, GripVertical, AlertCircle, RotateCw } from 'lucide-react';
import { FileItem } from '@/lib/pdfMerger';

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onReorder: (files: FileItem[]) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRotate: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileList({ files, onRemove, onReorder, onToggleSelect, onSelectAll, onDeselectAll, onRotate }: FileListProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = files.findIndex(f => f.id === draggedId);
    const targetIndex = files.findIndex(f => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFiles = [...files];
    const [removed] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, removed);
    onReorder(newFiles);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText size={20} />;
      case 'image':
        return <ImageIcon size={20} />;
      case 'text':
        return <FileText size={20} />;
      case 'word':
        return <FileText size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'icon-circle icon-pdf';
      case 'image':
        return 'icon-circle icon-image';
      case 'text':
        return 'icon-circle icon-text';
      case 'word':
        return 'icon-circle icon-word';
      default:
        return 'icon-circle icon-other';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'image':
        return 'Image → PDF';
      case 'text':
        return 'Text → PDF';
      case 'word':
        return 'Word → PDF';
      default:
        return 'Skipped';
    }
  };

  if (files.length === 0) {
    return null;
  }

  const supportedFiles = files.filter(f => f.type !== 'unsupported');
  const selectedCount = supportedFiles.filter(f => f.selected).length;
  const unsupportedCount = files.filter(f => f.type === 'unsupported').length;
  const allSelected = supportedFiles.length > 0 && supportedFiles.every(f => f.selected);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-ink-800">
          Files to Merge
        </h3>
        <div className="flex gap-2 text-sm">
          <span className="px-3 py-1 bg-accent-rust/10 text-accent-rust rounded-full">
            {selectedCount} selected
          </span>
          {unsupportedCount > 0 && (
            <span className="px-3 py-1 bg-ink-200 text-ink-600 rounded-full">
              {unsupportedCount} skipped
            </span>
          )}
        </div>
      </div>

      {/* Select All / Deselect All buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={onSelectAll}
          disabled={allSelected}
          className="px-3 py-1.5 text-xs font-medium text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors disabled:opacity-50"
        >
          Select All
        </button>
        <button
          onClick={onDeselectAll}
          disabled={selectedCount === 0}
          className="px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Deselect All
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {files.map((file, index) => (
          <div
            key={file.id}
            draggable
            onDragStart={(e) => handleDragStart(e, file.id)}
            onDragOver={(e) => handleDragOver(e, file.id)}
            onDragEnd={handleDragEnd}
            className={`file-item flex items-center gap-3 p-3 ${
              draggedId === file.id ? 'opacity-50' : ''
            } ${file.type === 'unsupported' ? 'opacity-60' : ''} ${
              file.type !== 'unsupported' && !file.selected ? 'opacity-50 bg-ink-50' : ''
            }`}
          >
            <button className="text-ink-300 hover:text-ink-500 cursor-grab active:cursor-grabbing">
              <GripVertical size={16} />
            </button>

            {file.type !== 'unsupported' && (
              <input
                type="checkbox"
                checked={file.selected}
                onChange={() => onToggleSelect(file.id)}
                className="w-4 h-4 rounded border-ink-300 text-accent-teal focus:ring-accent-teal cursor-pointer"
              />
            )}

            <span className="text-ink-400 text-sm w-6">{index + 1}</span>

            <div className={getIconClass(file.type)}>
              {getIcon(file.type)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-700 truncate">
                {file.name}
              </p>
              <p className="text-xs text-ink-400">
                {formatFileSize(file.size)} • {getTypeLabel(file.type)}
                {file.rotation !== 0 && (
                  <span className="ml-2 text-accent-teal">↻{file.rotation}°</span>
                )}
              </p>
            </div>

            {file.type !== 'unsupported' && (
              <button
                onClick={() => onRotate(file.id)}
                className="p-1.5 text-ink-400 hover:text-accent-teal hover:bg-accent-teal/10 rounded-full transition-colors"
                title={`Rotate (currently ${file.rotation}°)`}
              >
                <RotateCw size={16} />
              </button>
            )}

            <button
              onClick={() => onRemove(file.id)}
              className="p-1.5 text-ink-400 hover:text-accent-rust hover:bg-accent-rust/10 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-400 mt-4 text-center">
        Drag to reorder • Files merge in this order
      </p>
    </div>
  );
}

