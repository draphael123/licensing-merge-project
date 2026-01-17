'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useI18n, languages, Language } from '@/lib/i18n';

export default function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center gap-2"
        aria-label="Select language"
      >
        <Globe size={20} className="text-white" />
        <span className="text-white text-sm hidden sm:inline">{languages[language].flag}</span>
      </button>

      <AnimatePresence>
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
              className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="p-2">
                <p className="text-xs text-gray-500 px-2 py-1 font-medium">Select Language</p>
                {(Object.entries(languages) as [Language, typeof languages[Language]][]).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLanguage(code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      language === code 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-lg">{flag}</span>
                    <span className="flex-1 text-left text-sm">{name}</span>
                    {language === code && <Check size={16} className="text-blue-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

