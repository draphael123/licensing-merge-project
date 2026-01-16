'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Hash, 
  Type, 
  Droplets, 
  BookOpen,
  FileText,
  Settings
} from 'lucide-react';

export interface MergeOptions {
  // Page Numbers
  addPageNumbers: boolean;
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
  pageNumberFormat: 'Page X of Y' | 'X / Y' | 'X' | '- X -';
  
  // Header/Footer
  addHeader: boolean;
  headerText: string;
  addFooter: boolean;
  footerText: string;
  
  // Watermark
  addWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  
  // Table of Contents
  addTableOfContents: boolean;
  
  // Metadata
  pdfTitle: string;
  pdfAuthor: string;
  pdfSubject: string;
}

export const defaultMergeOptions: MergeOptions = {
  addPageNumbers: false,
  pageNumberPosition: 'bottom-center',
  pageNumberFormat: 'Page X of Y',
  addHeader: false,
  headerText: '',
  addFooter: false,
  footerText: '',
  addWatermark: false,
  watermarkText: 'CONFIDENTIAL',
  watermarkOpacity: 0.15,
  addTableOfContents: false,
  pdfTitle: '',
  pdfAuthor: '',
  pdfSubject: '',
};

interface AdvancedOptionsProps {
  options: MergeOptions;
  onChange: (options: MergeOptions) => void;
}

export default function AdvancedOptions({ options, onChange }: AdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'content' | 'metadata'>('pages');

  const updateOption = <K extends keyof MergeOptions>(key: K, value: MergeOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  const activeFeatures = [
    options.addPageNumbers && 'Page #',
    options.addHeader && 'Header',
    options.addFooter && 'Footer',
    options.addWatermark && 'Watermark',
    options.addTableOfContents && 'TOC',
    options.pdfTitle && 'Title',
  ].filter(Boolean);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Settings size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800">Advanced Options</h3>
            <p className="text-xs text-gray-500">
              {activeFeatures.length > 0 
                ? `Active: ${activeFeatures.join(', ')}`
                : 'Page numbers, headers, watermarks, and more'
              }
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('pages')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'pages' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Hash size={16} className="inline mr-1" /> Pages
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'content' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Type size={16} className="inline mr-1" /> Content
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'metadata' 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={16} className="inline mr-1" /> Info
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Pages Tab */}
            {activeTab === 'pages' && (
              <>
                {/* Page Numbers */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.addPageNumbers}
                      onChange={(e) => updateOption('addPageNumbers', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-medium text-gray-700">Add Page Numbers</span>
                      <p className="text-xs text-gray-500">Number each page in the merged PDF</p>
                    </div>
                  </label>

                  {options.addPageNumbers && (
                    <div className="ml-8 space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Position</label>
                        <select
                          value={options.pageNumberPosition}
                          onChange={(e) => updateOption('pageNumberPosition', e.target.value as MergeOptions['pageNumberPosition'])}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="bottom-center">Bottom Center</option>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Format</label>
                        <select
                          value={options.pageNumberFormat}
                          onChange={(e) => updateOption('pageNumberFormat', e.target.value as MergeOptions['pageNumberFormat'])}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="Page X of Y">Page 1 of 10</option>
                          <option value="X / Y">1 / 10</option>
                          <option value="X">1</option>
                          <option value="- X -">- 1 -</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Table of Contents */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.addTableOfContents}
                      onChange={(e) => updateOption('addTableOfContents', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-medium text-gray-700">Add Table of Contents</span>
                      <p className="text-xs text-gray-500">First page lists all documents with page numbers</p>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <>
                {/* Header */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.addHeader}
                      onChange={(e) => updateOption('addHeader', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-medium text-gray-700">Add Header</span>
                      <p className="text-xs text-gray-500">Text at the top of every page</p>
                    </div>
                  </label>

                  {options.addHeader && (
                    <div className="ml-8">
                      <input
                        type="text"
                        value={options.headerText}
                        onChange={(e) => updateOption('headerText', e.target.value)}
                        placeholder="Enter header text..."
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.addFooter}
                      onChange={(e) => updateOption('addFooter', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-medium text-gray-700">Add Footer</span>
                      <p className="text-xs text-gray-500">Text at the bottom of every page</p>
                    </div>
                  </label>

                  {options.addFooter && (
                    <div className="ml-8">
                      <input
                        type="text"
                        value={options.footerText}
                        onChange={(e) => updateOption('footerText', e.target.value)}
                        placeholder="Enter footer text..."
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Watermark */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.addWatermark}
                      onChange={(e) => updateOption('addWatermark', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-medium text-gray-700">Add Watermark</span>
                      <p className="text-xs text-gray-500">Diagonal text across every page</p>
                    </div>
                  </label>

                  {options.addWatermark && (
                    <div className="ml-8 space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Watermark Text</label>
                        <input
                          type="text"
                          value={options.watermarkText}
                          onChange={(e) => updateOption('watermarkText', e.target.value)}
                          placeholder="CONFIDENTIAL"
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Opacity: {Math.round(options.watermarkOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.05"
                          max="0.5"
                          step="0.05"
                          value={options.watermarkOpacity}
                          onChange={(e) => updateOption('watermarkOpacity', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Metadata Tab */}
            {activeTab === 'metadata' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Set PDF document properties (visible in file properties)
                </p>
                
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Document Title</label>
                  <input
                    type="text"
                    value={options.pdfTitle}
                    onChange={(e) => updateOption('pdfTitle', e.target.value)}
                    placeholder="e.g., Provider Credentials 2024"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1">Author</label>
                  <input
                    type="text"
                    value={options.pdfAuthor}
                    onChange={(e) => updateOption('pdfAuthor', e.target.value)}
                    placeholder="e.g., Your Name or Company"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={options.pdfSubject}
                    onChange={(e) => updateOption('pdfSubject', e.target.value)}
                    placeholder="e.g., Licensing Documents"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

