'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bug, Lightbulb, Star, Send, X, ThumbsUp, ThumbsDown } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'general';
type Rating = 1 | 2 | 3 | 4 | 5;

interface FeedbackProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Feedback({ isOpen, onClose }: FeedbackProps) {
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<Rating | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // In a real app, this would send to a backend
    console.log('Feedback submitted:', { type, message, rating, email });
    
    // Store locally for now
    const feedback = {
      id: Date.now(),
      type,
      message,
      rating,
      email,
      date: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    const existing = JSON.parse(localStorage.getItem('feedback') || '[]');
    localStorage.setItem('feedback', JSON.stringify([...existing, feedback]));
    
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setRating(null);
      setEmail('');
      onClose();
    }, 2000);
  };

  const types = [
    { id: 'bug' as const, icon: Bug, label: 'Report Bug', color: 'text-red-500 bg-red-100' },
    { id: 'feature' as const, icon: Lightbulb, label: 'Request Feature', color: 'text-yellow-500 bg-yellow-100' },
    { id: 'general' as const, icon: MessageSquare, label: 'General Feedback', color: 'text-blue-500 bg-blue-100' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {submitted ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <ThumbsUp className="text-green-500" size={32} />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Thank You!</h3>
              <p className="text-gray-500">Your feedback helps us improve.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-blue-500" size={20} />
                  <h3 className="font-bold text-gray-800 dark:text-white">Send Feedback</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What type of feedback?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {types.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`p-3 rounded-xl text-center transition-all border-2 ${
                          type === t.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center mx-auto mb-2`}>
                          <t.icon size={20} />
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating (for general feedback) */}
                {type === 'general' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      How would you rate your experience?
                    </label>
                    <div className="flex gap-2 justify-center">
                      {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRating(r)}
                          className={`p-2 transition-all ${
                            rating && rating >= r
                              ? 'text-yellow-400 scale-110'
                              : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        >
                          <Star size={28} fill={rating && rating >= r ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {type === 'bug' ? 'Describe the bug' : type === 'feature' ? 'Describe your idea' : 'Your feedback'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === 'bug'
                        ? 'What happened? What did you expect to happen?'
                        : type === 'feature'
                        ? 'What feature would you like to see?'
                        : 'Tell us what you think...'
                    }
                    className="w-full h-32 p-3 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">We&apos;ll only use this to follow up if needed.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  Send Feedback
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating feedback button component
export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-2"
        title="Send Feedback"
      >
        <MessageSquare size={20} />
        <span className="hidden sm:inline text-sm font-medium">Feedback</span>
      </button>
      <Feedback isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

