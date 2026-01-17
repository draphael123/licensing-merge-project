'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Plus, Trash2, Check, Star, FileText, Image, Settings } from 'lucide-react';
import { MergeOptions } from './AdvancedOptions';
import { OutputFormat } from '@/lib/pdfMerger';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  outputFormat: OutputFormat;
  options: MergeOptions;
  isDefault?: boolean;
}

const defaultTemplates: Template[] = [
  {
    id: 'photo-album',
    name: 'Photo Album',
    description: 'High quality images with page numbers',
    icon: '📸',
    outputFormat: 'pdf-high-quality',
    options: {
      addPageNumbers: true,
      pageNumberPosition: 'bottom-center',
      pageNumberFormat: 'X / Y',
      addHeader: false,
      headerText: '',
      addFooter: false,
      footerText: '',
      addWatermark: false,
      watermarkText: '',
      watermarkOpacity: 0.3,
      addTableOfContents: false,
      pdfTitle: 'Photo Album',
      pdfAuthor: '',
      pdfSubject: '',
    },
    isDefault: true,
  },
  {
    id: 'report',
    name: 'Business Report',
    description: 'With TOC, headers, and page numbers',
    icon: '📊',
    outputFormat: 'pdf',
    options: {
      addPageNumbers: true,
      pageNumberPosition: 'bottom-right',
      pageNumberFormat: 'Page X of Y',
      addHeader: true,
      headerText: 'Report',
      addFooter: true,
      footerText: 'Confidential',
      addWatermark: false,
      watermarkText: '',
      watermarkOpacity: 0.3,
      addTableOfContents: true,
      pdfTitle: 'Business Report',
      pdfAuthor: '',
      pdfSubject: '',
    },
    isDefault: true,
  },
  {
    id: 'compressed',
    name: 'Small File',
    description: 'Optimized for email attachment',
    icon: '📧',
    outputFormat: 'pdf-compressed',
    options: {
      addPageNumbers: false,
      pageNumberPosition: 'bottom-center',
      pageNumberFormat: 'X',
      addHeader: false,
      headerText: '',
      addFooter: false,
      footerText: '',
      addWatermark: false,
      watermarkText: '',
      watermarkOpacity: 0.3,
      addTableOfContents: false,
      pdfTitle: '',
      pdfAuthor: '',
      pdfSubject: '',
    },
    isDefault: true,
  },
  {
    id: 'draft',
    name: 'Draft Document',
    description: 'With DRAFT watermark',
    icon: '📝',
    outputFormat: 'pdf',
    options: {
      addPageNumbers: true,
      pageNumberPosition: 'bottom-center',
      pageNumberFormat: 'Page X of Y',
      addHeader: false,
      headerText: '',
      addFooter: false,
      footerText: '',
      addWatermark: true,
      watermarkText: 'DRAFT',
      watermarkOpacity: 0.3,
      addTableOfContents: false,
      pdfTitle: 'Draft',
      pdfAuthor: '',
      pdfSubject: '',
    },
    isDefault: true,
  },
];

interface TemplatesProps {
  currentOptions: MergeOptions;
  currentFormat: OutputFormat;
  onApply: (template: Template) => void;
  onSave: (name: string) => void;
}

export default function Templates({ currentOptions, currentFormat, onApply, onSave }: TemplatesProps) {
  const [customTemplates, setCustomTemplates] = useState<Template[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('customTemplates') || '[]');
    }
    return [];
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAll, setShowAll] = useState(false);

  const allTemplates = [...defaultTemplates, ...customTemplates];
  const displayedTemplates = showAll ? allTemplates : allTemplates.slice(0, 4);

  const saveCustomTemplate = useCallback(() => {
    if (!newName.trim()) return;

    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: newName,
      description: 'Custom template',
      icon: '⭐',
      outputFormat: currentFormat,
      options: { ...currentOptions },
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('customTemplates', JSON.stringify(updated));
    
    setNewName('');
    setIsCreating(false);
  }, [newName, currentFormat, currentOptions, customTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem('customTemplates', JSON.stringify(updated));
  }, [customTemplates]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="text-amber-500" size={18} />
          <h4 className="font-semibold text-gray-800">Quick Templates</h4>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <Plus size={14} />
          Save Current
        </button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {displayedTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onApply(template)}
            className="p-3 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left group relative"
          >
            <span className="text-2xl mb-1 block">{template.icon}</span>
            <p className="text-sm font-medium text-gray-700 truncate">{template.name}</p>
            <p className="text-xs text-gray-400 truncate">{template.description}</p>
            
            {/* Delete button for custom templates */}
            {!template.isDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTemplate(template.id);
                }}
                className="absolute top-1 right-1 p-1 bg-red-100 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </button>
        ))}
      </div>

      {allTemplates.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          {showAll ? 'Show less' : `Show ${allTemplates.length - 4} more`}
        </button>
      )}

      {/* Create Template Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg text-gray-800 mb-4">Save as Template</h3>
              <p className="text-sm text-gray-500 mb-4">
                Save your current settings as a reusable template.
              </p>
              
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Template name"
                className="w-full p-3 border border-gray-200 rounded-xl mb-4"
                autoFocus
              />

              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-2">Current settings:</p>
                <div className="flex flex-wrap gap-2">
                  {currentOptions.addPageNumbers && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Page #s</span>
                  )}
                  {currentOptions.addTableOfContents && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">TOC</span>
                  )}
                  {currentOptions.addWatermark && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Watermark</span>
                  )}
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {currentFormat === 'pdf-compressed' ? 'Compressed' : currentFormat === 'pdf-high-quality' ? 'High Quality' : 'Standard'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomTemplate}
                  disabled={!newName.trim()}
                  className="flex-1 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

