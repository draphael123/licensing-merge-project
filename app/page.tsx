'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Download, Sparkles, Trash2, FileStack, Zap, Shield, Folder, PartyPopper, Check, Lock, Clock, CreditCard, Wifi, Undo2, Redo2 } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import FileList from '@/components/FileList';
import ProgressBar from '@/components/ProgressBar';
import OutputOptions from '@/components/OutputOptions';
import AdvancedOptions, { MergeOptions, defaultMergeOptions } from '@/components/AdvancedOptions';
import FileSearch from '@/components/FileSearch';
import SplitPdf from '@/components/SplitPdf';
import ThemeSelector from '@/components/ThemeSelector';
import StatsDashboard from '@/components/StatsDashboard';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import BatchOperations from '@/components/BatchOperations';
import { FileItem, MergeProgress, OutputFormat, mergeFiles } from '@/lib/pdfMerger';
import { useAppStore, themes } from '@/lib/store';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { useConfetti } from '@/lib/useConfetti';

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [progress, setProgress] = useState<MergeProgress | null>(null);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('pdf');
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>(defaultMergeOptions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image' | 'text' | 'word'>('all');
  
  // Store state
  const { 
    theme, 
    darkMode, 
    setDarkMode,
    addMergeHistory,
    incrementMerge,
    addAchievement,
    setFiles: setStoreFiles,
    undo,
    redo,
    canUndo,
    canRedo,
    fileHistory,
  } = useAppStore();
  
  const { celebrate } = useConfetti();

  // Sync files with store for undo/redo
  useEffect(() => {
    if (files.length > 0) {
      setStoreFiles(files);
    }
  }, [files, setStoreFiles]);

  // Handle undo from store
  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo();
      setFiles(fileHistory.past[fileHistory.past.length - 1] || []);
    }
  }, [canUndo, undo, fileHistory.past]);

  // Handle redo from store
  const handleRedo = useCallback(() => {
    if (canRedo()) {
      redo();
      setFiles(fileHistory.future[0] || []);
    }
  }, [canRedo, redo, fileHistory.future]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onMerge: () => !isMerging && selectedFileCount > 0 && handleMerge(),
    onDownload: () => mergedBlob && handleDownload(),
    onClear: () => handleClearAll(),
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSelectAll: () => handleSelectAll(),
    onDeselectAll: () => handleDeselectAll(),
    onToggleDarkMode: () => setDarkMode(!darkMode),
  });

  // Detect duplicates
  const duplicates = useMemo(() => {
    const seen = new Map<string, number>();
    files.forEach(f => {
      const key = `${f.name}-${f.size}`;
      seen.set(key, (seen.get(key) || 0) + 1);
    });
    return Array.from(seen.entries()).filter(([, count]) => count > 1).length;
  }, [files]);

  // Filter files for display
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || f.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [files, searchTerm, filterType]);

  // Estimate file size
  const estimatedSize = useMemo(() => {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const multiplier = outputFormat === 'pdf-compressed' ? 0.5 : 
                       outputFormat === 'pdf-high-quality' ? 1.2 : 0.8;
    return (totalSize * multiplier) / (1024 * 1024);
  }, [files, outputFormat]);

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

  const handleRotate = useCallback((id: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const newRotation = ((f.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...f, rotation: newRotation };
      }
      return f;
    }));
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
      const blob = await mergeFiles(filesToMerge, setProgress, outputFormat, mergeOptions);
      setMergedBlob(blob);
      
      // Celebrate with confetti!
      celebrate();
      
      // Track stats and history
      incrementMerge(filesToMerge.length, filesToMerge.length * 5, blob.size);
      addMergeHistory({
        fileCount: filesToMerge.length,
        fileNames: filesToMerge.map(f => f.name),
        outputSize: blob.size,
        settings: {
          format: outputFormat,
          pageNumbers: mergeOptions.addPageNumbers,
          watermark: mergeOptions.watermarkText,
        },
      });
      
      // Check for achievements
      const stats = useAppStore.getState().stats;
      if (stats.totalMerges === 1) addAchievement('first_merge');
      if (stats.totalMerges >= 10) addAchievement('ten_merges');
      if (stats.totalMerges >= 50) addAchievement('fifty_merges');
      if (stats.totalFilesProcessed >= 100) addAchievement('hundred_files');
      if (stats.totalSizeProcessed >= 1024 * 1024 * 1024) addAchievement('gigabyte');
      if (stats.streak >= 7) addAchievement('week_streak');
      
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 6) addAchievement('night_owl');
      if (hour >= 4 && hour < 6) addAchievement('early_bird');
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during merge';
      setError(message);
      console.error('Merge error:', err);
    } finally {
      setIsMerging(false);
    }
  }, [files, outputFormat, mergeOptions, celebrate, incrementMerge, addMergeHistory, addAchievement]);

  const handleDownload = useCallback(() => {
    if (!mergedBlob) return;

    const url = URL.createObjectURL(mergedBlob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = mergeOptions.pdfTitle 
      ? `${mergeOptions.pdfTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`
      : `merged-document-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [mergedBlob, mergeOptions.pdfTitle]);

  const selectedFileCount = files.filter(f => f.type !== 'unsupported' && f.selected).length;
  const hasFiles = files.length > 0;

  return (
    <main 
      className={`relative z-10 min-h-screen py-12 px-4 transition-colors theme-${theme} ${darkMode ? 'dark-mode' : ''}`}
      style={{ background: themes[theme].gradient, backgroundSize: '400% 400%' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Fixed Controls */}
        <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
          <KeyboardShortcuts />
          <ThemeSelector />
        </div>

        {/* Undo/Redo Controls */}
        {hasFiles && (
          <div className="fixed top-4 left-4 flex items-center gap-2 z-50">
            <button
              onClick={handleUndo}
              disabled={!canUndo()}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} className="text-white" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo()}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors disabled:opacity-30"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={18} className="text-white" />
            </button>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-12">
          <div className="badge mb-6">
            <Sparkles size={18} className="text-yellow-500" />
            <span>Free &amp; runs entirely in your browser</span>
            <PartyPopper size={18} className="text-pink-500" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight">
            <span className="rainbow-text">Document</span>
            <br />
            <span className="text-white glow">Merger</span>
          </h1>
          
          <p className="text-xl text-white/90 max-w-lg mx-auto leading-relaxed font-medium">
            Combine PDFs and images into a single document ✨
            <br />
            <span className="text-white/70">Drop folders, merge files, download instantly!</span>
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* File Uploader */}
          <FileUploader 
            onFilesAdded={handleFilesAdded} 
            disabled={isMerging}
          />

          {/* Search and Filter */}
          {hasFiles && (
            <div className="card p-4">
              <FileSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterType={filterType}
                onFilterChange={setFilterType}
                totalFiles={files.length}
                filteredFiles={filteredFiles.length}
                duplicateCount={duplicates}
              />
            </div>
          )}

          {/* File List */}
          {hasFiles && (
            <FileList 
              files={filteredFiles} 
              onRemove={handleRemoveFile}
              onReorder={handleReorder}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onRotate={handleRotate}
            />
          )}

          {/* Estimated Size */}
          {hasFiles && files.length > 0 && (
            <div className="card p-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimated output size:</span>
              <span className="font-bold text-gray-800">~{estimatedSize.toFixed(1)} MB</span>
            </div>
          )}

          {/* Output Options */}
          {hasFiles && (
            <OutputOptions
              format={outputFormat}
              onFormatChange={setOutputFormat}
            />
          )}

          {/* Advanced Options */}
          {hasFiles && (
            <AdvancedOptions
              options={mergeOptions}
              onChange={setMergeOptions}
            />
          )}

          {/* Progress Bar */}
          {progress && <ProgressBar progress={progress} />}

          {/* Error Message */}
          {error && (
            <div className="card p-4 border-red-300 bg-red-50">
              <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
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
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all flex items-center gap-2 font-semibold backdrop-blur-sm"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          )}

          {/* Merged Result Info */}
          {mergedBlob && (
            <div className="card p-6 text-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <p className="text-green-600 font-bold text-lg">
                🎉 Merged successfully! {(mergedBlob.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* Split PDF Tool */}
        <section className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">✂️ Split PDF Tool</h2>
            <p className="text-white/70">Need to extract pages? Split your PDF into multiple files</p>
          </div>
          <div className="max-w-xl mx-auto">
            <SplitPdf />
          </div>
        </section>

        {/* Batch Operations */}
        <section className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">⚡ Batch Operations</h2>
            <p className="text-white/70">Compress multiple PDFs or convert images in bulk</p>
          </div>
          <div className="max-w-xl mx-auto">
            <BatchOperations />
          </div>
        </section>

        {/* Stats Dashboard */}
        <section className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">📊 Your Stats</h2>
            <p className="text-white/70">Track your merging journey and unlock achievements</p>
          </div>
          <div className="max-w-xl mx-auto">
            <StatsDashboard />
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="icon-circle icon-pdf mx-auto mb-4 float">
              <Folder size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">Drop Folders</h3>
            <p className="text-sm text-gray-600">
              Drop entire folders and we&apos;ll find all PDFs, images, and documents inside.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="icon-circle icon-image mx-auto mb-4 float stagger-2">
              <Zap size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">Fast &amp; Local</h3>
            <p className="text-sm text-gray-600">
              Everything runs in your browser. No uploads, no waiting, no file size limits.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="icon-circle icon-other mx-auto mb-4 float stagger-3">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">100% Private</h3>
            <p className="text-sm text-gray-600">
              Your files never leave your computer. We don&apos;t store or transmit anything.
            </p>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="rainbow-text">Why Choose Us?</span>
          </h2>
          
          <div className="card p-6 mb-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-bold text-gray-700">Feature</th>
                  <th className="text-center py-3 px-2">
                    <span className="rainbow-text font-bold">Us</span>
                  </th>
                  <th className="text-center py-3 px-2 text-gray-500">Other Tools</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-2 font-medium text-gray-700">💰 Price</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> 100% Free
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">$5-20/month</td>
                </tr>
                <tr className="border-b border-gray-100 bg-purple-50/50">
                  <td className="py-3 px-2 font-medium text-gray-700">🔒 Privacy</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> Files never uploaded
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">Files sent to servers</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-2 font-medium text-gray-700">📁 File Size Limit</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> Unlimited
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">10-100 MB limit</td>
                </tr>
                <tr className="border-b border-gray-100 bg-purple-50/50">
                  <td className="py-3 px-2 font-medium text-gray-700">📑 Advanced Options</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> All included free
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">Premium features</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Your Data Stays Private</h3>
                  <p className="text-sm text-gray-600">
                    Your files <strong>never leave your computer</strong>. Perfect for sensitive documents.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                  <Wifi size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Works Offline</h3>
                  <p className="text-sm text-gray-600">
                    Once loaded, works <strong>without internet</strong>. Great for any situation.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">No Waiting</h3>
                  <p className="text-sm text-gray-600">
                    Process everything <strong>instantly on your device</strong>. Merge 100+ files in seconds.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Truly Free Forever</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Unlimited merges, unlimited file size</strong>. No credit card needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="mt-16 card p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            <span className="rainbow-text">How to Use</span>
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="step-number step-1 mx-auto mb-3">1</div>
              <h4 className="font-bold text-gray-800 mb-2">Add Files</h4>
              <p className="text-sm text-gray-600">
                Drag &amp; drop files or folders onto the drop zone.
              </p>
            </div>

            <div className="text-center">
              <div className="step-number step-2 mx-auto mb-3">2</div>
              <h4 className="font-bold text-gray-800 mb-2">Select &amp; Arrange</h4>
              <p className="text-sm text-gray-600">
                Choose files and drag to reorder.
              </p>
            </div>

            <div className="text-center">
              <div className="step-number step-3 mx-auto mb-3">3</div>
              <h4 className="font-bold text-gray-800 mb-2">Set Options</h4>
              <p className="text-sm text-gray-600">
                Add page numbers, headers, watermarks.
              </p>
            </div>

            <div className="text-center">
              <div className="step-number step-4 mx-auto mb-3">4</div>
              <h4 className="font-bold text-gray-800 mb-2">Download</h4>
              <p className="text-sm text-gray-600">
                Click merge and download your PDF.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 text-center">Supported Formats</h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 text-center mb-2">Documents</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="format-badge format-pdf">PDF</span>
                  <span className="format-badge format-word">DOCX</span>
                  <span className="format-badge format-word">DOC</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 text-center mb-2">Images</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="format-badge format-image">JPG</span>
                  <span className="format-badge format-image">PNG</span>
                  <span className="format-badge format-image">GIF</span>
                  <span className="format-badge format-image">WebP</span>
                  <span className="format-badge format-image">HEIC</span>
                  <span className="format-badge format-image">TIFF</span>
                  <span className="format-badge format-image">SVG</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 text-center mb-2">Text Files</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="format-badge format-text">TXT</span>
                  <span className="format-badge format-text">MD</span>
                  <span className="format-badge format-text">CSV</span>
                  <span className="format-badge format-text">JSON</span>
                  <span className="format-badge format-text">HTML</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-white/80 font-medium">
            Built with 💜 • Your documents stay on your device
          </p>
        </footer>
      </div>
    </main>
  );
}
