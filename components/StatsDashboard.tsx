'use client';

import { motion } from 'framer-motion';
import { BarChart3, Files, FileStack, HardDrive, Flame, Trophy, X } from 'lucide-react';
import { useAppStore, ACHIEVEMENTS } from '@/lib/store';
import { useState } from 'react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function StatsDashboard() {
  const { stats, mergeHistory, clearMergeHistory } = useAppStore();
  const [showHistory, setShowHistory] = useState(false);

  const statCards = [
    { 
      icon: FileStack, 
      label: 'Total Merges', 
      value: stats.totalMerges.toString(),
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: Files, 
      label: 'Files Processed', 
      value: stats.totalFilesProcessed.toString(),
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: HardDrive, 
      label: 'Data Processed', 
      value: formatBytes(stats.totalSizeProcessed),
      color: 'from-orange-500 to-red-500'
    },
    { 
      icon: Flame, 
      label: 'Day Streak', 
      value: `${stats.streak} days`,
      color: 'from-yellow-500 to-orange-500'
    },
  ];

  const earnedAchievements = Object.values(ACHIEVEMENTS).filter(
    a => stats.achievements.includes(a.id)
  );

  const lockedAchievements = Object.values(ACHIEVEMENTS).filter(
    a => !stats.achievements.includes(a.id)
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <BarChart3 className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Your Stats</h3>
            <p className="text-sm text-gray-500">Track your merging journey</p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          {showHistory ? 'View Stats' : 'View History'}
        </button>
      </div>

      {!showHistory ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                  <stat.icon className="text-white" size={16} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Achievements */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-yellow-500" size={18} />
              <h4 className="font-semibold text-gray-700">Achievements</h4>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                {earnedAchievements.length}/{Object.keys(ACHIEVEMENTS).length}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {earnedAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center p-2 bg-yellow-50 rounded-xl"
                  title={`${achievement.name}: ${achievement.desc}`}
                >
                  <span className="text-2xl mb-1">{achievement.icon}</span>
                  <span className="text-xs text-gray-600 text-center truncate w-full">
                    {achievement.name}
                  </span>
                </motion.div>
              ))}
              
              {lockedAchievements.slice(0, 4 - earnedAchievements.length).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center p-2 bg-gray-100 rounded-xl opacity-50"
                  title={`Locked: ${achievement.desc}`}
                >
                  <span className="text-2xl mb-1 grayscale">🔒</span>
                  <span className="text-xs text-gray-400 text-center truncate w-full">
                    ???
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Merge History */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-700">Recent Merges</h4>
            {mergeHistory.length > 0 && (
              <button
                onClick={clearMergeHistory}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Clear History
              </button>
            )}
          </div>

          {mergeHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileStack className="mx-auto mb-2 opacity-50" size={32} />
              <p>No merge history yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mergeHistory.map((merge) => (
                <motion.div
                  key={merge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 text-sm">
                      {merge.fileCount} files merged
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(merge.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {merge.fileNames.slice(0, 3).join(', ')}
                    {merge.fileNames.length > 3 && ` +${merge.fileNames.length - 3} more`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {formatBytes(merge.outputSize)}
                    </span>
                    {merge.settings.pageNumbers && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        Page #s
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

