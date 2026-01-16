'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Upload, Download, FileText, Loader2 } from 'lucide-react';
import { splitPdf, SplitOptions, SplitResult, getPdfInfo } from '@/lib/pdfMerger';

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'pages' | 'chunks' | 'ranges'>('pages');
  const [chunkSize, setChunkSize] = useState<number>(5);
  const [ranges, setRanges] = useState<string>('');
  const [results, setResults] = useState<SplitResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResults([]);
      const info = await getPdfInfo(selectedFile);
      setPageCount(info.pageCount);
    }
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: 0 });

    try {
      const options: SplitOptions = {
        mode: splitMode,
        ...(splitMode === 'chunks' && { chunkSize }),
        ...(splitMode === 'ranges' && { ranges }),
      };

      const splitResults = await splitPdf(
        file,
        options,
        (current, total) => setProgress({ current, total })
      );

      setResults(splitResults);
    } catch (error) {
      console.error('Split error:', error);
      alert('Failed to split PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, splitMode, chunkSize, ranges]);

  const handleDownload = useCallback((result: SplitResult) => {
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

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Scissors className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink-800">Split PDF</h3>
          <p className="text-sm text-ink-500">Separate pages into multiple files</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block">
          <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            file 
              ? 'border-accent-teal bg-accent-teal/5' 
              : 'border-ink-200 hover:border-accent-teal hover:bg-accent-teal/5'
          }`}>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="text-accent-teal" size={24} />
                <div className="text-left">
                  <p className="font-medium text-ink-700">{file.name}</p>
                  <p className="text-sm text-ink-500">{pageCount} pages</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="mx-auto text-ink-400 mb-2" size={32} />
                <p className="font-medium text-ink-600">Select a PDF to split</p>
                <p className="text-sm text-ink-400">Click to browse</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Split Options */}
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-6"
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'pages', label: 'Single Pages', desc: '1 page per file' },
              { value: 'chunks', label: 'Chunks', desc: 'N pages per file' },
              { value: 'ranges', label: 'Custom', desc: 'Specific pages' },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setSplitMode(mode.value as typeof splitMode)}
                className={`p-3 rounded-xl text-left transition-all ${
                  splitMode === mode.value
                    ? 'bg-accent-teal text-white'
                    : 'bg-ink-50 hover:bg-ink-100 text-ink-700'
                }`}
              >
                <p className="font-medium text-sm">{mode.label}</p>
                <p className={`text-xs ${splitMode === mode.value ? 'text-white/70' : 'text-ink-400'}`}>
                  {mode.desc}
                </p>
              </button>
            ))}
          </div>

          {splitMode === 'chunks' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-ink-600">Pages per file:</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={chunkSize}
                onChange={(e) => setChunkSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
              />
              <span className="text-sm text-ink-400">
                ({Math.ceil(pageCount / chunkSize)} files)
              </span>
            </div>
          )}

          {splitMode === 'ranges' && (
            <div>
              <label className="block text-sm text-ink-600 mb-2">
                Page ranges (e.g., 1-3, 5, 7-10):
              </label>
              <input
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="1-3, 5, 7-10"
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
              />
              <p className="text-xs text-ink-400 mt-1">
                PDF has {pageCount} pages total
              </p>
            </div>
          )}

          <button
            onClick={handleSplit}
            disabled={isProcessing || (splitMode === 'ranges' && !ranges.trim())}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Splitting... {progress.current}/{progress.total}
              </>
            ) : (
              <>
                <Scissors size={20} />
                Split PDF
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-ink-100 pt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-ink-700">
                ✂️ {results.length} files created
              </h4>
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 text-sm font-medium text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors"
              >
                Download All
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-ink-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-accent-rust" size={18} />
                    <div>
                      <p className="text-sm font-medium text-ink-700">{result.name}</p>
                      <p className="text-xs text-ink-400">{result.pageCount} page(s)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(result)}
                    className="p-2 text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors"
                  >
                    <Download size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

