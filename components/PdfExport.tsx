'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileOutput, Image, FileText, Download, Upload, Loader2, X, FileImage } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

type ExportFormat = 'images' | 'text';

interface ExportedFile {
  name: string;
  blob: Blob;
  type: string;
}

export default function PdfExport() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('images');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [imageQuality, setImageQuality] = useState(0.9);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ExportedFile[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResults([]);
      setExtractedText('');
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        setPageCount(pdf.getPageCount());
      } catch {
        setPageCount(0);
      }
    }
  }, []);

  const exportToImages = useCallback(async () => {
    if (!file) return;
    
    setProcessing(true);
    setProgress({ current: 0, total: pageCount });
    const exported: ExportedFile[] = [];

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ current: i, total: pdf.numPages });
        
        const page = await pdf.getPage(i);
        const scale = 2; // High quality
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const mimeType = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, imageQuality);
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        exported.push({
          name: `${file.name.replace('.pdf', '')}_page_${i}.${imageFormat}`,
          blob,
          type: mimeType,
        });
      }

      setResults(exported);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [file, pageCount, imageFormat, imageQuality]);

  const exportToText = useCallback(async () => {
    if (!file) return;
    
    setProcessing(true);
    setProgress({ current: 0, total: pageCount });
    let fullText = '';

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress({ current: i, total: pdf.numPages });
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? (item as { str: string }).str : ''))
          .filter(Boolean)
          .join(' ');
        
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      setExtractedText(fullText);

      // Create downloadable text file
      const blob = new Blob([fullText], { type: 'text/plain' });
      setResults([{
        name: `${file.name.replace('.pdf', '')}.txt`,
        blob,
        type: 'text/plain',
      }]);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to extract text. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [file, pageCount]);

  const handleExport = useCallback(() => {
    if (exportFormat === 'images') {
      exportToImages();
    } else {
      exportToText();
    }
  }, [exportFormat, exportToImages, exportToText]);

  const handleDownload = useCallback((result: ExportedFile) => {
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

  const copyText = useCallback(() => {
    navigator.clipboard.writeText(extractedText);
  }, [extractedText]);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <FileOutput className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Export PDF</h3>
          <p className="text-sm text-gray-500">Convert PDF to images or extract text</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block">
          <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            file 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
          }`}>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="text-emerald-500" size={24} />
                <div className="text-left">
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">{pageCount} pages</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="font-medium text-gray-600">Select a PDF to export</p>
                <p className="text-sm text-gray-400">Click to browse</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Export Options */}
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-6"
        >
          {/* Format Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExportFormat('images')}
              className={`p-4 rounded-xl text-left transition-all border-2 ${
                exportFormat === 'images'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileImage className={`mb-2 ${exportFormat === 'images' ? 'text-emerald-500' : 'text-gray-400'}`} size={24} />
              <p className="font-medium text-gray-700">Export as Images</p>
              <p className="text-xs text-gray-500">PNG or JPEG per page</p>
            </button>
            <button
              onClick={() => setExportFormat('text')}
              className={`p-4 rounded-xl text-left transition-all border-2 ${
                exportFormat === 'text'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`mb-2 ${exportFormat === 'text' ? 'text-emerald-500' : 'text-gray-400'}`} size={24} />
              <p className="font-medium text-gray-700">Extract Text</p>
              <p className="text-xs text-gray-500">Plain text from PDF</p>
            </button>
          </div>

          {/* Image Options */}
          {exportFormat === 'images' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600">Format:</label>
                <select
                  value={imageFormat}
                  onChange={(e) => setImageFormat(e.target.value as 'png' | 'jpeg')}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg"
                >
                  <option value="png">PNG (lossless)</option>
                  <option value="jpeg">JPEG (smaller)</option>
                </select>
              </div>
              {imageFormat === 'jpeg' && (
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600">Quality:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-12">{Math.round(imageQuality * 100)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={processing}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Exporting... {progress.current}/{progress.total}
              </>
            ) : (
              <>
                <FileOutput size={20} />
                Export {exportFormat === 'images' ? 'as Images' : 'Text'}
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Extracted Text Preview */}
      {extractedText && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-700">Extracted Text</h4>
            <button
              onClick={copyText}
              className="text-sm text-emerald-500 hover:text-emerald-600"
            >
              Copy to Clipboard
            </button>
          </div>
          <textarea
            value={extractedText}
            readOnly
            className="w-full h-48 p-3 border border-gray-200 rounded-xl text-sm font-mono bg-gray-50 resize-none"
          />
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && exportFormat === 'images' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700">
                📸 {results.length} images exported
              </h4>
              <button
                onClick={handleDownloadAll}
                className="text-sm text-emerald-500 hover:text-emerald-600"
              >
                Download All
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="relative group cursor-pointer"
                  onClick={() => handleDownload(result)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(result.blob)}
                    alt={result.name}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Download size={20} className="text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single text file download */}
      {results.length > 0 && exportFormat === 'text' && (
        <button
          onClick={() => handleDownload(results[0])}
          className="w-full py-3 rounded-xl font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Download Text File
        </button>
      )}
    </div>
  );
}

