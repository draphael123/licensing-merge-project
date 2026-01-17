'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface PdfPreviewProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onSelectPages?: (pages: number[]) => void;
  selectedPages?: number[];
}

export default function PdfPreview({ 
  file, 
  isOpen, 
  onClose, 
  onSelectPages,
  selectedPages: initialSelectedPages 
}: PdfPreviewProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set(initialSelectedPages || []));
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF and render pages
  useEffect(() => {
    if (!isOpen || !file) return;

    const loadPdf = async () => {
      setLoading(true);
      try {
        // Dynamic import of pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const pageImages: string[] = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          
          pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
        }
        
        setPages(pageImages);
        
        // Select all pages by default
        if (initialSelectedPages === undefined) {
          setSelectedPages(new Set(pageImages.map((_, i) => i)));
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [isOpen, file, initialSelectedPages]);

  const togglePage = useCallback((pageIndex: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageIndex)) {
        newSet.delete(pageIndex);
      } else {
        newSet.add(pageIndex);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPages(new Set(pages.map((_, i) => i)));
  }, [pages]);

  const deselectAll = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    if (onSelectPages) {
      onSelectPages(Array.from(selectedPages).sort((a, b) => a - b));
    }
    onClose();
  }, [selectedPages, onSelectPages, onClose]);

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
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">{file.name}</h3>
              <p className="text-sm text-gray-500">
                {pages.length} pages • {selectedPages.size} selected
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' 
                      : 'text-gray-500'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'single' 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' 
                      : 'text-gray-500'
                  }`}
                >
                  Single
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <ZoomIn size={18} />
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div 
            ref={containerRef}
            className="overflow-auto p-4"
            style={{ maxHeight: 'calc(90vh - 180px)' }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : viewMode === 'grid' ? (
              <div 
                className="grid gap-4"
                style={{ 
                  gridTemplateColumns: `repeat(auto-fill, minmax(${150 * zoom}px, 1fr))` 
                }}
              >
                {pages.map((page, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => togglePage(index)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPages.has(index)
                        ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={page} 
                      alt={`Page ${index + 1}`}
                      className="w-full h-auto"
                    />
                    
                    {/* Page number badge */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    
                    {/* Selection indicator */}
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      selectedPages.has(index)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/80 border border-gray-300'
                    }`}>
                      {selectedPages.has(index) && <Check size={14} />}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={pages[currentPage]}
                    alt={`Page ${currentPage + 1}`}
                    style={{ maxWidth: `${600 * zoom}px` }}
                    className="rounded-lg shadow-lg"
                  />
                  
                  {/* Navigation arrows */}
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-50"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                    disabled={currentPage === pages.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-50"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
                
                {/* Page indicator */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => togglePage(currentPage)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedPages.has(currentPage)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {selectedPages.has(currentPage) ? 'Selected' : 'Select Page'}
                  </button>
                  <span className="text-gray-500">
                    Page {currentPage + 1} of {pages.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Deselect All
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {onSelectPages && (
                <button
                  onClick={handleConfirm}
                  disabled={selectedPages.size === 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  Confirm Selection ({selectedPages.size} pages)
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

