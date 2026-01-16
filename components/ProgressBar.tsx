'use client';

import React from 'react';
import { MergeProgress } from '@/lib/pdfMerger';

interface ProgressBarProps {
  progress: MergeProgress | null;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  if (!progress) return null;

  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-ink-700">
          {progress.phase === 'complete' ? 'Complete!' : progress.message}
        </span>
        <span className="text-sm text-ink-500">
          {percentage}%
        </span>
      </div>

      <div className="progress-bar h-3">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {progress.currentFile && progress.phase !== 'complete' && (
        <p className="text-xs text-ink-400 mt-2 truncate">
          Processing: {progress.currentFile}
        </p>
      )}
    </div>
  );
}

