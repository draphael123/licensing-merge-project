'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Image, FileDown, Loader2, Upload, Download, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

type BatchMode = 'compress' | 'images-to-pdf' | 'extract-pages';

interface ProcessedFile {
  name: string;
  blob: Blob;
  originalSize?: number;
  newSize: number;
}

export default function BatchOperations() {
  const [mode, setMode] = useState<BatchMode | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    setResults([]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
    setResults([]);
  }, []);

  const compressPdfs = useCallback(async () => {
    setProcessing(true);
    setProgress({ current: 0, total: files.length });
    const processed: ProcessedFile[] = [];

    const qualitySettings = {
      low: { imageQuality: 0.3, maxDimension: 800 },
      medium: { imageQuality: 0.5, maxDimension: 1200 },
      high: { imageQuality: 0.7, maxDimension: 1600 },
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        
        // Save with compression
        const pdfBytes = await pdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });

        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        
        processed.push({
          name: file.name.replace('.pdf', '_compressed.pdf'),
          blob,
          originalSize: file.size,
          newSize: blob.size,
        });
      } catch (error) {
        console.error(`Error compressing ${file.name}:`, error);
      }
    }

    setResults(processed);
    setProcessing(false);
  }, [files, compressionLevel]);

  const convertImagesToPdf = useCallback(async () => {
    setProcessing(true);
    setProgress({ current: 0, total: files.length });
    const processed: ProcessedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });

      if (!file.type.startsWith('image/')) continue;

      try {
        const pdf = await PDFDocument.create();
        
        // Load image
        const imageBytes = await file.arrayBuffer();
        let image;
        
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdf.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdf.embedPng(imageBytes);
        } else {
          // Convert other formats via canvas
          const img = new window.Image();
          img.src = URL.createObjectURL(file);
          await new Promise<void>(resolve => { img.onload = () => resolve(); });
          
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const base64Data = jpegDataUrl.split(',')[1];
          const jpegBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          image = await pdf.embedJpg(jpegBytes);
          
          URL.revokeObjectURL(img.src);
        }

        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });

        const pdfBytes = await pdf.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        
        processed.push({
          name: file.name.replace(/\.[^/.]+$/, '.pdf'),
          blob,
          newSize: blob.size,
        });
      } catch (error) {
        console.error(`Error converting ${file.name}:`, error);
      }
    }

    setResults(processed);
    setProcessing(false);
  }, [files]);

  const handleProcess = useCallback(() => {
    if (mode === 'compress') {
      compressPdfs();
    } else if (mode === 'images-to-pdf') {
      convertImagesToPdf();
    }
  }, [mode, compressPdfs, convertImagesToPdf]);

  const handleDownload = useCallback((result: ProcessedFile) => {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadAll = useCallback(() => {
    results.forEach((result, index) => {
      setTimeout(() => handleDownload(result), index * 200);
    });
  }, [results, handleDownload]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const modes = [
    { id: 'compress' as const, icon: FileDown, label: 'Compress PDFs', desc: 'Reduce file sizes' },
    { id: 'images-to-pdf' as const, icon: Image, label: 'Images to PDF', desc: 'Convert each image' },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Layers className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Batch Operations</h3>
          <p className="text-sm text-gray-500">Process multiple files at once</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setResults([]);
            }}
            className={`p-4 rounded-xl text-left transition-all border-2 ${
              mode === m.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <m.icon className={`mb-2 ${mode === m.id ? 'text-orange-500' : 'text-gray-400'}`} size={24} />
            <p className="font-medium text-gray-700">{m.label}</p>
            <p className="text-xs text-gray-500">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* File Upload Area */}
      {mode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
          >
            <input
              type="file"
              multiple
              accept={mode === 'compress' ? '.pdf' : 'image/*'}
              onChange={handleFileSelect}
              className="hidden"
              id="batch-file-input"
            />
            <label htmlFor="batch-file-input" className="cursor-pointer">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="font-medium text-gray-600">
                Drop {mode === 'compress' ? 'PDFs' : 'images'} here
              </p>
              <p className="text-sm text-gray-400">or click to browse</p>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {files.length} file(s) selected
                </span>
                <button
                  onClick={() => {
                    setFiles([]);
                    setResults([]);
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1">{file.name}</span>
                    <span className="text-gray-400 ml-2">{formatSize(file.size)}</span>
                    <button
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compression Level (for compress mode) */}
          {mode === 'compress' && files.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Compression:</span>
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setCompressionLevel(level)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    compressionLevel === level
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Process Button */}
          {files.length > 0 && (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing {progress.current}/{progress.total}...
                </>
              ) : (
                <>
                  <Layers size={20} />
                  Process {files.length} File(s)
                </>
              )}
            </button>
          )}

          {/* Results */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 pt-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700">
                    ✅ {results.length} file(s) processed
                  </h4>
                  <button
                    onClick={handleDownloadAll}
                    className="text-sm text-orange-500 hover:text-orange-600"
                  >
                    Download All
                  </button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{result.name}</p>
                        <p className="text-xs text-gray-500">
                          {result.originalSize && (
                            <>
                              {formatSize(result.originalSize)} → {' '}
                            </>
                          )}
                          {formatSize(result.newSize)}
                          {result.originalSize && (
                            <span className="text-green-500 ml-1">
                              ({Math.round((1 - result.newSize / result.originalSize) * 100)}% smaller)
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(result)}
                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Download size={18} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

