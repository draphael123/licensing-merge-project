'use client';

import React, { useState, useCallback } from 'react';
import { Download, Sparkles, Trash2, FileStack, Zap, Shield, Folder } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import FileList from '@/components/FileList';
import ProgressBar from '@/components/ProgressBar';
import OutputOptions from '@/components/OutputOptions';
import { FileItem, MergeProgress, OutputFormat, mergeFiles } from '@/lib/pdfMerger';

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [progress, setProgress] = useState<MergeProgress | null>(null);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('pdf');

  const handleFilesAdded = useCallback((newFiles: FileItem[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setMergedBlob(null);
    setError(null);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedBlob(null);
  }, []);

  const handleReorder = useCallback((newFiles: FileItem[]) => {
    setFiles(newFiles);
    setMergedBlob(null);
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, selected: !f.selected } : f
    ));
    setMergedBlob(null);
  }, []);

  const handleSelectAll = useCallback(() => {
    setFiles(prev => prev.map(f => 
      f.type !== 'unsupported' ? { ...f, selected: true } : f
    ));
    setMergedBlob(null);
  }, []);

  const handleDeselectAll = useCallback(() => {
    setFiles(prev => prev.map(f => ({ ...f, selected: false })));
    setMergedBlob(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setProgress(null);
    setMergedBlob(null);
    setError(null);
  }, []);

  const handleMerge = useCallback(async () => {
    const filesToMerge = files.filter(f => f.type !== 'unsupported' && f.selected);
    
    if (filesToMerge.length === 0) {
      setError('No files selected to merge. Please select at least one file.');
      return;
    }

    setIsMerging(true);
    setError(null);
    setMergedBlob(null);

    try {
      const blob = await mergeFiles(filesToMerge, setProgress);
      setMergedBlob(blob);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during merge';
      setError(message);
      console.error('Merge error:', err);
    } finally {
      setIsMerging(false);
    }
  }, [files]);

  const handleDownload = useCallback(() => {
    if (!mergedBlob) return;

    const url = URL.createObjectURL(mergedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merged-document-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [mergedBlob]);

  const selectedFileCount = files.filter(f => f.type !== 'unsupported' && f.selected).length;
  const hasFiles = files.length > 0;

  return (
    <main className="relative z-10 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-sm text-ink-600 mb-6">
            <Sparkles size={16} className="text-accent-gold" />
            Free &amp; runs entirely in your browser
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-ink-900 mb-4 tracking-tight">
            Document Merger
          </h1>
          
          <p className="text-xl text-ink-600 max-w-lg mx-auto leading-relaxed">
            Combine PDFs and images into a single document.
            <br />
            <span className="text-ink-500">Drop folders, merge files, download instantly.</span>
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* File Uploader */}
          <FileUploader 
            onFilesAdded={handleFilesAdded} 
            disabled={isMerging}
          />

          {/* File List */}
          {hasFiles && (
            <FileList 
              files={files} 
              onRemove={handleRemoveFile}
              onReorder={handleReorder}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
          )}

          {/* Output Options */}
          {hasFiles && (
            <OutputOptions
              format={outputFormat}
              onFormatChange={setOutputFormat}
            />
          )}

          {/* Progress Bar */}
          {progress && <ProgressBar progress={progress} />}

          {/* Error Message */}
          {error && (
            <div className="card p-4 border-accent-rust/30 bg-accent-rust/5">
              <p className="text-accent-rust text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          {hasFiles && (
            <div className="flex flex-wrap gap-4 justify-center">
              {!mergedBlob ? (
                <button
                  onClick={handleMerge}
                  disabled={isMerging || selectedFileCount === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  <FileStack size={20} />
                  {isMerging ? 'Merging...' : `Merge ${selectedFileCount} File${selectedFileCount !== 1 ? 's' : ''}`}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download size={20} />
                  Download PDF
                </button>
              )}

              <button
                onClick={handleClearAll}
                disabled={isMerging}
                className="px-6 py-3 text-ink-600 hover:text-accent-rust hover:bg-accent-rust/10 rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          )}

          {/* Merged Result Info */}
          {mergedBlob && (
            <div className="card p-6 text-center bg-accent-teal/5 border-accent-teal/20">
              <p className="text-accent-teal font-medium">
                ✓ Merged successfully! {(mergedBlob.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <section className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="icon-circle icon-pdf mx-auto mb-4">
              <Folder size={24} />
            </div>
            <h3 className="font-semibold text-ink-800 mb-2">Drop Folders</h3>
            <p className="text-sm text-ink-500">
              Drop entire folders and we&apos;ll find all PDFs and images inside, including subfolders.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="icon-circle icon-image mx-auto mb-4">
              <Zap size={24} />
            </div>
            <h3 className="font-semibold text-ink-800 mb-2">Fast &amp; Local</h3>
            <p className="text-sm text-ink-500">
              Everything runs in your browser. No uploads, no waiting, no file size limits.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="icon-circle icon-other mx-auto mb-4">
              <Shield size={24} />
            </div>
            <h3 className="font-semibold text-ink-800 mb-2">100% Private</h3>
            <p className="text-sm text-ink-500">
              Your files never leave your computer. We don&apos;t store or transmit anything.
            </p>
          </div>
        </section>

        {/* Instructions */}
        <section className="mt-16 card p-8">
          <h2 className="text-2xl font-bold text-ink-800 mb-6 text-center">How to Use</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent-rust/10 text-accent-rust font-bold flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold text-ink-700 mb-2">Add Files</h4>
              <p className="text-sm text-ink-500">
                Drag &amp; drop files or folders onto the drop zone.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent-gold/10 text-accent-gold font-bold flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold text-ink-700 mb-2">Select Files</h4>
              <p className="text-sm text-ink-500">
                Use checkboxes to choose which files to include.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent-teal/10 text-accent-teal font-bold flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold text-ink-700 mb-2">Arrange Order</h4>
              <p className="text-sm text-ink-500">
                Drag files to reorder how they appear in the PDF.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent-navy/10 text-accent-navy font-bold flex items-center justify-center mx-auto mb-3">
                4
              </div>
              <h4 className="font-semibold text-ink-700 mb-2">Merge &amp; Download</h4>
              <p className="text-sm text-ink-500">
                Click merge, then download your combined PDF.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-ink-100">
            <h4 className="font-semibold text-ink-700 mb-3 text-center">Supported Formats</h4>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1.5 bg-accent-rust/10 text-accent-rust text-sm rounded-full">PDF</span>
              <span className="px-3 py-1.5 bg-accent-teal/10 text-accent-teal text-sm rounded-full">JPG / JPEG</span>
              <span className="px-3 py-1.5 bg-accent-teal/10 text-accent-teal text-sm rounded-full">PNG</span>
              <span className="px-3 py-1.5 bg-accent-teal/10 text-accent-teal text-sm rounded-full">GIF</span>
              <span className="px-3 py-1.5 bg-accent-teal/10 text-accent-teal text-sm rounded-full">WebP</span>
              <span className="px-3 py-1.5 bg-accent-teal/10 text-accent-teal text-sm rounded-full">BMP</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-ink-400">
          <p>Built with care • Your documents stay on your device</p>
        </footer>
      </div>
    </main>
  );
}
