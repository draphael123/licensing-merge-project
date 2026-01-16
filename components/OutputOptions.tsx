'use client';

import React from 'react';
import { FileOutput, Minimize2, Maximize2 } from 'lucide-react';
import { OutputFormat } from '@/lib/pdfMerger';

interface OutputOptionsProps {
  format: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
}

const formatOptions: { value: OutputFormat; label: string; description: string; details: string; icon: React.ReactNode }[] = [
  {
    value: 'pdf-compressed',
    label: 'Compressed (Smallest)',
    description: 'Minimizes file size for easy sharing',
    details: 'Images: 50% quality, max 1200px • Best for email/web',
    icon: <Minimize2 size={18} />,
  },
  {
    value: 'pdf',
    label: 'Standard (Balanced)',
    description: 'Good quality with reasonable file size',
    details: 'Images: 80% quality, max 2400px • Recommended',
    icon: <FileOutput size={18} />,
  },
  {
    value: 'pdf-high-quality',
    label: 'High Quality (Largest)',
    description: 'Maximum quality, preserves original resolution',
    details: 'Images: 95% quality, original size • Best for printing',
    icon: <Maximize2 size={18} />,
  },
];

export default function OutputOptions({ format, onFormatChange }: OutputOptionsProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-ink-800 mb-4">Output Options</h3>
      
      <div className="space-y-2">
        {formatOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
              format === option.value
                ? 'bg-accent-teal/10 border-2 border-accent-teal'
                : 'bg-white/50 border-2 border-transparent hover:bg-white/80'
            }`}
          >
            <input
              type="radio"
              name="outputFormat"
              value={option.value}
              checked={format === option.value}
              onChange={() => onFormatChange(option.value)}
              className="sr-only"
            />
            
            <div className={`p-2 rounded-lg ${
              format === option.value ? 'bg-accent-teal/20 text-accent-teal' : 'bg-ink-100 text-ink-500'
            }`}>
              {option.icon}
            </div>
            
            <div className="flex-1">
              <p className={`font-medium ${format === option.value ? 'text-accent-teal' : 'text-ink-700'}`}>
                {option.label}
              </p>
              <p className="text-xs text-ink-500">{option.description}</p>
              <p className="text-xs text-ink-400 mt-0.5">{option.details}</p>
            </div>
            
            {format === option.value && (
              <div className="w-5 h-5 rounded-full bg-accent-teal flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

