'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Edit3, Upload, Trash2, RotateCw, Download, Loader2, GripVertical, FileText, Save, Undo2 } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

interface PageData {
  index: number;
  thumbnail: string;
  rotation: number;
  deleted: boolean;
}

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [originalOrder, setOriginalOrder] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPages([]);
      setOriginalOrder([]);
      await loadPages(selectedFile);
    }
  }, []);

  const loadPages = async (pdfFile: File) => {
    setLoading(true);
    const loadedPages: PageData[] = [];

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setProgress({ current: 0, total: pdf.numPages });

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ current: i, total: pdf.numPages });
        
        const page = await pdf.getPage(i);
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

        loadedPages.push({
          index: i - 1,
          thumbnail: canvas.toDataURL('image/jpeg', 0.6),
          rotation: 0,
          deleted: false,
        });
      }

      setPages(loadedPages);
      setOriginalOrder([...loadedPages]);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDelete = useCallback((index: number) => {
    setPages(prev => prev.map((p, i) => 
      i === index ? { ...p, deleted: !p.deleted } : p
    ));
  }, []);

  const rotatePage = useCallback((index: number) => {
    setPages(prev => prev.map((p, i) => 
      i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  }, []);

  const resetChanges = useCallback(() => {
    setPages([...originalOrder]);
  }, [originalOrder]);

  const hasChanges = JSON.stringify(pages) !== JSON.stringify(originalOrder);

  const savePdf = useCallback(async () => {
    if (!file) return;

    setSaving(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      // Get pages that aren't deleted, in current order
      const activePages = pages.filter(p => !p.deleted);

      for (const pageData of activePages) {
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageData.index]);
        
        // Apply rotation
        if (pageData.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pageData.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '_edited.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [file, pages]);

  const activeCount = pages.filter(p => !p.deleted).length;
  const deletedCount = pages.filter(p => p.deleted).length;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
          <Edit3 className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">PDF Editor</h3>
          <p className="text-sm text-gray-500">Delete, rotate & rearrange pages</p>
        </div>
      </div>

      {/* File Upload */}
      {!file && (
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-violet-500 hover:bg-violet-50">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="font-medium text-gray-600">Select a PDF to edit</p>
            <p className="text-sm text-gray-400 mt-1">Drag to reorder, click to delete/rotate</p>
          </div>
        </label>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-violet-500 mb-4" size={40} />
          <p className="text-gray-600">Loading pages... {progress.current}/{progress.total}</p>
        </div>
      )}

      {/* Editor */}
      {file && !loading && pages.length > 0 && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <FileText className="text-violet-500" size={20} />
              <div>
                <p className="font-medium text-gray-700 text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {activeCount} pages • {deletedCount > 0 && <span className="text-red-500">{deletedCount} deleted</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <button
                  onClick={resetChanges}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                >
                  <Undo2 size={14} />
                  Reset
                </button>
              )}
              <button
                onClick={() => {
                  setFile(null);
                  setPages([]);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Page Grid */}
          <Reorder.Group 
            axis="x" 
            values={pages} 
            onReorder={setPages}
            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3"
          >
            {pages.map((page, index) => (
              <Reorder.Item
                key={page.index}
                value={page}
                className={`relative group cursor-grab active:cursor-grabbing ${
                  page.deleted ? 'opacity-40' : ''
                }`}
              >
                <div className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  page.deleted 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200 hover:border-violet-400'
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.thumbnail}
                    alt={`Page ${page.index + 1}`}
                    className="w-full h-auto"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                    draggable={false}
                  />

                  {/* Page number */}
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {page.index + 1}
                  </div>

                  {/* Rotation indicator */}
                  {page.rotation !== 0 && (
                    <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded">
                      {page.rotation}°
                    </div>
                  )}

                  {/* Deleted indicator */}
                  {page.deleted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
                      <Trash2 className="text-red-600" size={24} />
                    </div>
                  )}

                  {/* Drag handle */}
                  <div className="absolute top-1 right-1 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={12} className="text-gray-500" />
                  </div>

                  {/* Action buttons */}
                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); rotatePage(index); }}
                      className="p-1 bg-white rounded hover:bg-gray-100"
                      title="Rotate"
                    >
                      <RotateCw size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleDelete(index); }}
                      className={`p-1 rounded ${page.deleted ? 'bg-green-100 hover:bg-green-200' : 'bg-white hover:bg-red-100'}`}
                      title={page.deleted ? 'Restore' : 'Delete'}
                    >
                      <Trash2 size={12} className={page.deleted ? 'text-green-600' : 'text-red-500'} />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Save Button */}
          <button
            onClick={savePdf}
            disabled={saving || activeCount === 0}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Edited PDF ({activeCount} pages)
              </>
            )}
          </button>

          {activeCount === 0 && (
            <p className="text-center text-sm text-red-500">
              All pages are deleted. Restore at least one page to save.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

