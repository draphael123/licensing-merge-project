'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check, RotateCw, Trash2, ChevronLeft, ChevronRight, Grid, List, Eye } from 'lucide-react';
import { FileItem } from '@/lib/pdfMerger';

interface PageInfo {
  fileId: string;
  fileName: string;
  pageIndex: number;
  thumbnail: string;
  selected: boolean;
  rotation: number;
}

interface PageSelectorProps {
  files: FileItem[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedPages: { fileId: string; pages: number[]; rotations: number[] }[]) => void;
}

export default function PageSelector({ files, isOpen, onClose, onConfirm }: PageSelectorProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewPage, setPreviewPage] = useState<PageInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load all PDF pages as thumbnails
  useEffect(() => {
    if (!isOpen || files.length === 0) return;

    const loadAllPages = async () => {
      setLoading(true);
      const allPages: PageInfo[] = [];
      
      const pdfFiles = files.filter(f => f.type === 'pdf');
      const imageFiles = files.filter(f => f.type === 'image');
      
      setLoadingProgress({ current: 0, total: pdfFiles.length + imageFiles.length });

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        // Process PDFs
        for (let fileIdx = 0; fileIdx < pdfFiles.length; fileIdx++) {
          const file = pdfFiles[fileIdx];
          setLoadingProgress({ current: fileIdx + 1, total: pdfFiles.length + imageFiles.length });
          
          try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const scale = 0.5;
              const viewport = page.getViewport({ scale });
              
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d')!;
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;
              
              allPages.push({
                fileId: file.id,
                fileName: file.name,
                pageIndex: pageNum - 1,
                thumbnail: canvas.toDataURL('image/jpeg', 0.6),
                selected: true,
                rotation: file.rotation || 0,
              });
            }
          } catch (error) {
            console.error(`Error loading PDF ${file.name}:`, error);
          }
        }

        // Process Images
        for (let imgIdx = 0; imgIdx < imageFiles.length; imgIdx++) {
          const file = imageFiles[imgIdx];
          setLoadingProgress({ current: pdfFiles.length + imgIdx + 1, total: pdfFiles.length + imageFiles.length });
          
          try {
            const url = URL.createObjectURL(file.file);
            allPages.push({
              fileId: file.id,
              fileName: file.name,
              pageIndex: 0,
              thumbnail: url,
              selected: true,
              rotation: file.rotation || 0,
            });
          } catch (error) {
            console.error(`Error loading image ${file.name}:`, error);
          }
        }

        setPages(allPages);
      } catch (error) {
        console.error('Error loading pages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllPages();
  }, [isOpen, files]);

  const togglePage = useCallback((index: number) => {
    setPages(prev => prev.map((p, i) => 
      i === index ? { ...p, selected: !p.selected } : p
    ));
  }, []);

  const rotatePage = useCallback((index: number) => {
    setPages(prev => prev.map((p, i) => 
      i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  }, []);

  const selectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  }, []);

  const selectByFile = useCallback((fileId: string) => {
    setPages(prev => prev.map(p => 
      p.fileId === fileId ? { ...p, selected: true } : p
    ));
  }, []);

  const deselectByFile = useCallback((fileId: string) => {
    setPages(prev => prev.map(p => 
      p.fileId === fileId ? { ...p, selected: false } : p
    ));
  }, []);

  const handleConfirm = useCallback(() => {
    // Group selected pages by file
    const filePages = new Map<string, { pages: number[]; rotations: number[] }>();
    
    pages.filter(p => p.selected).forEach(page => {
      if (!filePages.has(page.fileId)) {
        filePages.set(page.fileId, { pages: [], rotations: [] });
      }
      const fp = filePages.get(page.fileId)!;
      fp.pages.push(page.pageIndex);
      fp.rotations.push(page.rotation);
    });

    const result = Array.from(filePages.entries()).map(([fileId, data]) => ({
      fileId,
      ...data,
    }));

    onConfirm(result);
    onClose();
  }, [pages, onConfirm, onClose]);

  const selectedCount = pages.filter(p => p.selected).length;
  const uniqueFiles = Array.from(new Set(pages.map(p => p.fileId)));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Select Pages to Merge</h3>
              <p className="text-sm text-gray-500">
                {pages.length} pages from {uniqueFiles.length} files • {selectedCount} selected
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(Math.min(2, zoom + 0.25))} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                  <ZoomIn size={16} />
                </button>
              </div>

              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* File tabs */}
          <div className="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800 overflow-x-auto shrink-0">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
            >
              Deselect All
            </button>
            <div className="w-px bg-gray-200 mx-2" />
            {uniqueFiles.map(fileId => {
              const file = files.find(f => f.id === fileId);
              const filePageCount = pages.filter(p => p.fileId === fileId).length;
              const selectedInFile = pages.filter(p => p.fileId === fileId && p.selected).length;
              return (
                <button
                  key={fileId}
                  onClick={() => selectedInFile === filePageCount ? deselectByFile(fileId) : selectByFile(fileId)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedInFile === filePageCount 
                      ? 'bg-green-100 text-green-700' 
                      : selectedInFile > 0 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                  title={file?.name}
                >
                  {file?.name.slice(0, 20)}{file?.name && file.name.length > 20 ? '...' : ''} ({selectedInFile}/{filePageCount})
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div ref={containerRef} className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-500">Loading pages... {loadingProgress.current}/{loadingProgress.total}</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div 
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${120 * zoom}px, 1fr))` }}
              >
                {pages.map((page, index) => (
                  <motion.div
                    key={`${page.fileId}-${page.pageIndex}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.01, 0.5) }}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      page.selected
                        ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 opacity-50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={page.thumbnail} 
                      alt={`${page.fileName} page ${page.pageIndex + 1}`}
                      className="w-full h-auto"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                      onClick={() => togglePage(index)}
                    />
                    
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePage(index); }}
                        className={`p-2 rounded-full ${page.selected ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); rotatePage(index); }}
                        className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100"
                      >
                        <RotateCw size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewPage(page); }}
                        className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    
                    {/* Page info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs truncate">{page.fileName}</p>
                      <p className="text-white/70 text-xs">Page {page.pageIndex + 1}</p>
                    </div>

                    {/* Selection indicator */}
                    {page.selected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}

                    {/* Rotation indicator */}
                    {page.rotation !== 0 && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">
                        {page.rotation}°
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {pages.map((page, index) => (
                  <div
                    key={`${page.fileId}-${page.pageIndex}`}
                    className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                      page.selected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={page.selected}
                      onChange={() => togglePage(index)}
                      className="w-5 h-5"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.thumbnail}
                      alt={`${page.fileName} page ${page.pageIndex + 1}`}
                      className="w-16 h-20 object-cover rounded"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">{page.fileName}</p>
                      <p className="text-sm text-gray-500">Page {page.pageIndex + 1}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rotatePage(index)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title="Rotate"
                      >
                        <RotateCw size={18} />
                      </button>
                      <button
                        onClick={() => setPreviewPage(page)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
            <p className="text-sm text-gray-500">
              {selectedCount} of {pages.length} pages selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
              >
                Merge {selectedCount} Pages
              </button>
            </div>
          </div>
        </motion.div>

        {/* Page Preview Modal */}
        <AnimatePresence>
          {previewPage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center"
              onClick={() => setPreviewPage(null)}
            >
              <button
                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30"
                onClick={() => setPreviewPage(null)}
              >
                <X size={24} className="text-white" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPage.thumbnail}
                alt="Preview"
                className="max-w-[90vw] max-h-[90vh] object-contain"
                style={{ transform: `rotate(${previewPage.rotation}deg)` }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

