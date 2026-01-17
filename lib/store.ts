'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileItem } from './pdfMerger';

// Theme types
export type ThemeColor = 'rainbow' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'midnight';

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
}

export const themes: Record<ThemeColor, ThemeConfig> = {
  rainbow: {
    name: 'Rainbow Party',
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    accent: '#ffe66d',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #ffe66d 100%)',
  },
  ocean: {
    name: 'Ocean Breeze',
    primary: '#0077b6',
    secondary: '#00b4d8',
    accent: '#90e0ef',
    gradient: 'linear-gradient(135deg, #023e8a 0%, #0077b6 50%, #90e0ef 100%)',
  },
  sunset: {
    name: 'Sunset Vibes',
    primary: '#f72585',
    secondary: '#7209b7',
    accent: '#f8961e',
    gradient: 'linear-gradient(135deg, #f72585 0%, #7209b7 50%, #3a0ca3 100%)',
  },
  forest: {
    name: 'Forest Grove',
    primary: '#2d6a4f',
    secondary: '#40916c',
    accent: '#95d5b2',
    gradient: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #52b788 100%)',
  },
  lavender: {
    name: 'Lavender Dreams',
    primary: '#7b2cbf',
    secondary: '#9d4edd',
    accent: '#e0aaff',
    gradient: 'linear-gradient(135deg, #5a189a 0%, #7b2cbf 50%, #c77dff 100%)',
  },
  midnight: {
    name: 'Midnight Mode',
    primary: '#4361ee',
    secondary: '#3f37c9',
    accent: '#4cc9f0',
    gradient: 'linear-gradient(135deg, #14213d 0%, #1d3557 50%, #457b9d 100%)',
  },
};

// Recent merge history
export interface MergeHistory {
  id: string;
  date: string;
  fileCount: number;
  fileNames: string[];
  outputSize: number;
  settings: {
    format: string;
    pageNumbers: boolean;
    watermark: string;
  };
}

// Usage stats
export interface UsageStats {
  totalMerges: number;
  totalFilesProcessed: number;
  totalPagesProcessed: number;
  totalSizeProcessed: number; // in bytes
  favoriteFormat: string;
  streak: number; // days in a row
  lastUsedDate: string;
  achievements: string[];
}

// Undo/Redo state
interface HistoryState {
  past: FileItem[][];
  present: FileItem[];
  future: FileItem[][];
}

interface AppState {
  // Theme
  theme: ThemeColor;
  darkMode: boolean;
  setTheme: (theme: ThemeColor) => void;
  setDarkMode: (dark: boolean) => void;

  // Merge history
  mergeHistory: MergeHistory[];
  addMergeHistory: (merge: Omit<MergeHistory, 'id' | 'date'>) => void;
  clearMergeHistory: () => void;

  // Usage stats
  stats: UsageStats;
  incrementMerge: (fileCount: number, pageCount: number, size: number) => void;
  addAchievement: (achievement: string) => void;

  // File history for undo/redo
  fileHistory: HistoryState;
  setFiles: (files: FileItem[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Keyboard shortcuts enabled
  shortcutsEnabled: boolean;
  setShortcutsEnabled: (enabled: boolean) => void;
}

const initialStats: UsageStats = {
  totalMerges: 0,
  totalFilesProcessed: 0,
  totalPagesProcessed: 0,
  totalSizeProcessed: 0,
  favoriteFormat: 'pdf',
  streak: 0,
  lastUsedDate: '',
  achievements: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'rainbow',
      darkMode: false,
      setTheme: (theme) => set({ theme }),
      setDarkMode: (darkMode) => set({ darkMode }),

      // Merge history
      mergeHistory: [],
      addMergeHistory: (merge) => {
        const newMerge: MergeHistory = {
          ...merge,
          id: `merge-${Date.now()}`,
          date: new Date().toISOString(),
        };
        set((state) => ({
          mergeHistory: [newMerge, ...state.mergeHistory].slice(0, 20), // Keep last 20
        }));
      },
      clearMergeHistory: () => set({ mergeHistory: [] }),

      // Usage stats
      stats: initialStats,
      incrementMerge: (fileCount, pageCount, size) => {
        const today = new Date().toDateString();
        set((state) => {
          const lastDate = state.stats.lastUsedDate;
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          
          let newStreak = state.stats.streak;
          if (lastDate === yesterday) {
            newStreak += 1;
          } else if (lastDate !== today) {
            newStreak = 1;
          }

          const newStats = {
            ...state.stats,
            totalMerges: state.stats.totalMerges + 1,
            totalFilesProcessed: state.stats.totalFilesProcessed + fileCount,
            totalPagesProcessed: state.stats.totalPagesProcessed + pageCount,
            totalSizeProcessed: state.stats.totalSizeProcessed + size,
            streak: newStreak,
            lastUsedDate: today,
          };

          return { stats: newStats };
        });
      },
      addAchievement: (achievement) => {
        set((state) => {
          if (state.stats.achievements.includes(achievement)) return state;
          return {
            stats: {
              ...state.stats,
              achievements: [...state.stats.achievements, achievement],
            },
          };
        });
      },

      // File history for undo/redo
      fileHistory: {
        past: [],
        present: [],
        future: [],
      },
      setFiles: (files) => {
        set((state) => ({
          fileHistory: {
            past: [...state.fileHistory.past, state.fileHistory.present].slice(-50),
            present: files,
            future: [],
          },
        }));
      },
      undo: () => {
        set((state) => {
          if (state.fileHistory.past.length === 0) return state;
          const previous = state.fileHistory.past[state.fileHistory.past.length - 1];
          const newPast = state.fileHistory.past.slice(0, -1);
          return {
            fileHistory: {
              past: newPast,
              present: previous,
              future: [state.fileHistory.present, ...state.fileHistory.future],
            },
          };
        });
      },
      redo: () => {
        set((state) => {
          if (state.fileHistory.future.length === 0) return state;
          const next = state.fileHistory.future[0];
          const newFuture = state.fileHistory.future.slice(1);
          return {
            fileHistory: {
              past: [...state.fileHistory.past, state.fileHistory.present],
              present: next,
              future: newFuture,
            },
          };
        });
      },
      canUndo: () => get().fileHistory.past.length > 0,
      canRedo: () => get().fileHistory.future.length > 0,

      // Keyboard shortcuts
      shortcutsEnabled: true,
      setShortcutsEnabled: (enabled) => set({ shortcutsEnabled: enabled }),
    }),
    {
      name: 'document-merger-storage',
      partialize: (state) => ({
        theme: state.theme,
        darkMode: state.darkMode,
        mergeHistory: state.mergeHistory,
        stats: state.stats,
        shortcutsEnabled: state.shortcutsEnabled,
      }),
    }
  )
);

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_MERGE: { id: 'first_merge', name: 'First Steps', desc: 'Complete your first merge', icon: '🎉' },
  TEN_MERGES: { id: 'ten_merges', name: 'Getting Started', desc: 'Complete 10 merges', icon: '🔟' },
  FIFTY_MERGES: { id: 'fifty_merges', name: 'Power User', desc: 'Complete 50 merges', icon: '💪' },
  HUNDRED_FILES: { id: 'hundred_files', name: 'File Master', desc: 'Process 100 files', icon: '📚' },
  GIGABYTE: { id: 'gigabyte', name: 'Heavy Lifter', desc: 'Process 1GB of files', icon: '🏋️' },
  WEEK_STREAK: { id: 'week_streak', name: 'Dedicated', desc: 'Use for 7 days in a row', icon: '🔥' },
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', desc: 'Merge after midnight', icon: '🦉' },
  EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', desc: 'Merge before 6 AM', icon: '🐦' },
};

