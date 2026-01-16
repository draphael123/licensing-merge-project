'use client';

import React, { useState, useCallback } from 'react';
import { Download, Sparkles, Trash2, FileStack, Zap, Shield, Folder, PartyPopper, Check, X, Crown, Lock, Clock, CreditCard, Upload, Eye, Server, Wifi } from 'lucide-react';
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
      const blob = await mergeFiles(filesToMerge, setProgress, outputFormat);
      setMergedBlob(blob);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during merge';
      setError(message);
      console.error('Merge error:', err);
    } finally {
      setIsMerging(false);
    }
  }, [files, outputFormat]);

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

        {/* Features */}
        <section className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="icon-circle icon-pdf mx-auto mb-4 float">
              <Folder size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">Drop Folders</h3>
            <p className="text-sm text-gray-600">
              Drop entire folders and we&apos;ll find all PDFs and images inside, including subfolders.
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
          
          {/* Comparison Table */}
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
                  <td className="py-3 px-2 font-medium text-gray-700">⚡ Speed</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> Instant (local)
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">Wait for upload/download</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-2 font-medium text-gray-700">📝 Registration</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> Not required
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">Email required</td>
                </tr>
                <tr className="border-b border-gray-100 bg-purple-50/50">
                  <td className="py-3 px-2 font-medium text-gray-700">📂 Folder Support</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> Full recursive scan
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">Single files only</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-2 font-medium text-gray-700">🖼️ Image to PDF</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> Included
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">Separate tool needed</td>
                </tr>
                <tr className="bg-purple-50/50">
                  <td className="py-3 px-2 font-medium text-gray-700">🗜️ Compression Options</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <Check size={16} /> 3 quality levels
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-500">Limited or paid</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Benefit Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Your Data Stays Private</h3>
                  <p className="text-sm text-gray-600">
                    Unlike cloud-based tools, your files <strong>never leave your computer</strong>. 
                    No uploads, no servers, no data retention. Perfect for sensitive documents like 
                    medical records, legal files, or financial statements.
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
                    Once loaded, the tool works <strong>without internet</strong>. 
                    Great for working on planes, in areas with poor connectivity, 
                    or when you just want guaranteed privacy.
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
                    Cloud tools make you wait for uploads and downloads. 
                    We process everything <strong>instantly on your device</strong>. 
                    Merge 100+ files in seconds, not minutes.
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
                    No &quot;free tier&quot; limits, no credit card required, no upsells. 
                    <strong> Unlimited merges, unlimited file size</strong>. 
                    We don&apos;t have servers to pay for!
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
              <h4 className="font-bold text-gray-800 mb-2">Select Files</h4>
              <p className="text-sm text-gray-600">
                Use checkboxes to choose which files to include.
              </p>
            </div>

            <div className="text-center">
              <div className="step-number step-3 mx-auto mb-3">3</div>
              <h4 className="font-bold text-gray-800 mb-2">Arrange Order</h4>
              <p className="text-sm text-gray-600">
                Drag files to reorder how they appear in the PDF.
              </p>
            </div>

            <div className="text-center">
              <div className="step-number step-4 mx-auto mb-3">4</div>
              <h4 className="font-bold text-gray-800 mb-2">Download</h4>
              <p className="text-sm text-gray-600">
                Click merge, then download your combined PDF.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 text-center">Supported Formats</h4>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="format-badge format-pdf">PDF</span>
              <span className="format-badge format-image">JPG</span>
              <span className="format-badge format-image">PNG</span>
              <span className="format-badge format-image">GIF</span>
              <span className="format-badge format-image">WebP</span>
              <span className="format-badge format-image">BMP</span>
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
