'use client';

import React from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';

interface FileSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: 'all' | 'pdf' | 'image' | 'text' | 'word';
  onFilterChange: (type: 'all' | 'pdf' | 'image' | 'text' | 'word') => void;
  totalFiles: number;
  filteredFiles: number;
  duplicateCount: number;
}

export default function FileSearch({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  totalFiles,
  filteredFiles,
  duplicateCount,
}: FileSearchProps) {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
            filterType === 'all'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({totalFiles})
        </button>
        <button
          onClick={() => onFilterChange('pdf')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
            filterType === 'pdf'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          PDF
        </button>
        <button
          onClick={() => onFilterChange('image')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
            filterType === 'image'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Images
        </button>
        <button
          onClick={() => onFilterChange('word')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
            filterType === 'word'
              ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Word
        </button>
        <button
          onClick={() => onFilterChange('text')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
            filterType === 'text'
              ? 'bg-gradient-to-r from-cyan-500 to-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Text
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing {filteredFiles} of {totalFiles} files
        </span>
        {duplicateCount > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle size={14} />
            {duplicateCount} potential duplicate{duplicateCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

