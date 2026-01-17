'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Upload, ChevronLeft, ChevronRight, Loader2, Layers, SplitSquareHorizontal } from 'lucide-react';

interface PdfFile {
  file: File;
  pages: string[];
}

type ViewMode = 'side-by-side' | 'overlay' | 'slider';

export default function PdfCompare() {
  const [leftPdf, setLeftPdf] = useState<PdfFile | null>(null);
  const [rightPdf, setRightPdf] = useState<PdfFile | null>(null);
  const [loading, setLoading] = useState<'left' | 'right' | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [sliderPosition, setSliderPosition] = useState(50);

  const loadPdf = async (file: File, side: 'left' | 'right') => {
    setLoading(side);
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
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

      const pdfData = { file, pages: pageImages };
      
      if (side === 'left') {
        setLeftPdf(pdfData);
      } else {
        setRightPdf(pdfData);
      }
      
      setCurrentPage(0);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      loadPdf(file, side);
    }
  };

  const maxPages = Math.max(leftPdf?.pages.length || 0, rightPdf?.pages.length || 0);

  const FileUploadBox = ({ side, pdf }: { side: 'left' | 'right'; pdf: PdfFile | null }) => (
    <label className="block flex-1">
      <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all h-full flex flex-col items-center justify-center ${
        pdf 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
      }`}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileChange(e, side)}
          className="hidden"
        />
        {loading === side ? (
          <Loader2 className="animate-spin text-blue-500" size={32} />
        ) : pdf ? (
          <>
            <div className="text-blue-500 font-medium">{side === 'left' ? 'Original' : 'Compare'}</div>
            <p className="text-sm text-gray-600 truncate max-w-full">{pdf.file.name}</p>
            <p className="text-xs text-gray-400">{pdf.pages.length} pages</p>
          </>
        ) : (
          <>
            <Upload className="text-gray-400 mb-2" size={32} />
            <p className="font-medium text-gray-600">{side === 'left' ? 'Original PDF' : 'PDF to Compare'}</p>
            <p className="text-sm text-gray-400">Click to select</p>
          </>
        )}
      </div>
    </label>
  );

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
          <GitCompare className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Compare PDFs</h3>
          <p className="text-sm text-gray-500">View two PDFs side by side</p>
        </div>
      </div>

      {/* File Selection */}
      {(!leftPdf || !rightPdf) && (
        <div className="flex gap-4 mb-6">
          <FileUploadBox side="left" pdf={leftPdf} />
          <FileUploadBox side="right" pdf={rightPdf} />
        </div>
      )}

      {/* Comparison View */}
      {leftPdf && rightPdf && (
        <div className="space-y-4">
          {/* View Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewMode === 'side-by-side' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                }`}
              >
                <SplitSquareHorizontal size={16} className="inline mr-1" />
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  viewMode === 'overlay' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                }`}
              >
                <Layers size={16} className="inline mr-1" />
                Overlay
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setLeftPdf(null); setRightPdf(null); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change Files
              </button>
            </div>
          </div>

          {/* Overlay Controls */}
          {viewMode === 'overlay' && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Opacity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          )}

          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {maxPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(maxPages - 1, currentPage + 1))}
              disabled={currentPage >= maxPages - 1}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Comparison Area */}
          <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
            {viewMode === 'side-by-side' ? (
              <div className="flex gap-2 p-2 h-full">
                <div className="flex-1 bg-white rounded-lg overflow-auto">
                  {leftPdf.pages[currentPage] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={leftPdf.pages[currentPage]}
                      alt={`Original page ${currentPage + 1}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No page
                    </div>
                  )}
                </div>
                <div className="flex-1 bg-white rounded-lg overflow-auto">
                  {rightPdf.pages[currentPage] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rightPdf.pages[currentPage]}
                      alt={`Compare page ${currentPage + 1}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No page
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative p-2">
                {/* Base image (left) */}
                {leftPdf.pages[currentPage] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={leftPdf.pages[currentPage]}
                    alt={`Original page ${currentPage + 1}`}
                    className="w-full h-auto rounded-lg"
                  />
                )}
                {/* Overlay image (right) */}
                {rightPdf.pages[currentPage] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rightPdf.pages[currentPage]}
                    alt={`Compare page ${currentPage + 1}`}
                    className="absolute top-2 left-2 right-2 w-[calc(100%-1rem)] h-auto rounded-lg"
                    style={{ opacity: overlayOpacity }}
                  />
                )}
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex justify-between text-sm text-gray-500">
            <div>
              <span className="font-medium">Original:</span> {leftPdf.file.name}
            </div>
            <div>
              <span className="font-medium">Compare:</span> {rightPdf.file.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

