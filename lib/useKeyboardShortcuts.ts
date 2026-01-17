'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from './store';

interface KeyboardShortcuts {
  onMerge?: () => void;
  onDownload?: () => void;
  onClear?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onToggleDarkMode?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const { shortcutsEnabled, undo, redo, canUndo, canRedo } = useAppStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!shortcutsEnabled) return;

    // Ignore if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl/Cmd + M = Merge
    if (modifier && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      shortcuts.onMerge?.();
      return;
    }

    // Ctrl/Cmd + D = Download
    if (modifier && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      shortcuts.onDownload?.();
      return;
    }

    // Ctrl/Cmd + Shift + C = Clear all
    if (modifier && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      shortcuts.onClear?.();
      return;
    }

    // Ctrl/Cmd + Z = Undo
    if (modifier && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (canUndo()) {
        undo();
        shortcuts.onUndo?.();
      }
      return;
    }

    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
    if ((modifier && e.shiftKey && e.key.toLowerCase() === 'z') || 
        (modifier && e.key.toLowerCase() === 'y')) {
      e.preventDefault();
      if (canRedo()) {
        redo();
        shortcuts.onRedo?.();
      }
      return;
    }

    // Ctrl/Cmd + A = Select All
    if (modifier && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      shortcuts.onSelectAll?.();
      return;
    }

    // Escape = Deselect All
    if (e.key === 'Escape') {
      shortcuts.onDeselectAll?.();
      return;
    }

    // Ctrl/Cmd + Shift + D = Toggle Dark Mode
    if (modifier && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      shortcuts.onToggleDarkMode?.();
      return;
    }
  }, [shortcuts, shortcutsEnabled, undo, redo, canUndo, canRedo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Shortcut reference for display
export const SHORTCUTS = [
  { keys: ['Ctrl/⌘', 'M'], action: 'Merge files' },
  { keys: ['Ctrl/⌘', 'D'], action: 'Download merged PDF' },
  { keys: ['Ctrl/⌘', 'Z'], action: 'Undo' },
  { keys: ['Ctrl/⌘', 'Shift', 'Z'], action: 'Redo' },
  { keys: ['Ctrl/⌘', 'A'], action: 'Select all files' },
  { keys: ['Esc'], action: 'Deselect all' },
  { keys: ['Ctrl/⌘', 'Shift', 'C'], action: 'Clear all files' },
  { keys: ['Ctrl/⌘', 'Shift', 'D'], action: 'Toggle dark mode' },
];

