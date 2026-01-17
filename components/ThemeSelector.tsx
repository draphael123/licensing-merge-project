'use client';

import { motion } from 'framer-motion';
import { Palette, Moon, Sun, Check } from 'lucide-react';
import { useAppStore, themes, ThemeColor } from '@/lib/store';
import { useState } from 'react';

export default function ThemeSelector() {
  const { theme, setTheme, darkMode, setDarkMode } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center gap-2"
        aria-label="Theme settings"
      >
        <Palette size={20} className="text-white" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-white">Theme Settings</h3>
            </div>

            {/* Dark mode toggle */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {darkMode ? (
                    <Moon size={18} className="text-indigo-500" />
                  ) : (
                    <Sun size={18} className="text-yellow-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    darkMode ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Theme colors */}
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-3 uppercase font-medium">Color Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(themes) as [ThemeColor, typeof themes[ThemeColor]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      theme === key 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ background: config.gradient }}
                      />
                      {theme === key && (
                        <Check size={14} className="text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {config.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 mb-2 uppercase font-medium">Preview</p>
              <div 
                className="h-20 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: themes[theme].gradient }}
              >
                {themes[theme].name}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

