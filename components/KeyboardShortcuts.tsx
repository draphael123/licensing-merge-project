'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { SHORTCUTS } from '@/lib/useKeyboardShortcuts';
import { useAppStore } from '@/lib/store';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const { shortcutsEnabled, setShortcutsEnabled } = useAppStore();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        <Keyboard size={20} className="text-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Keyboard className="text-blue-500" size={20} />
                  <h3 className="font-bold text-gray-800 dark:text-white">Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-4">
                {/* Enable/Disable toggle */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Keyboard Shortcuts
                  </span>
                  <button
                    onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      shortcutsEnabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span 
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        shortcutsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Shortcuts list */}
                <div className="space-y-3">
                  {SHORTCUTS.map((shortcut, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between ${
                        !shortcutsEnabled ? 'opacity-50' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {shortcut.action}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-gray-400">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <p className="text-xs text-gray-500 text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-xs">?</kbd> anytime to show this panel
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

