import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, CheckCircle, ArrowRight, Coffee, BookOpen } from 'lucide-react';
import { Task, TimerState } from '../types';
import { formatTimeForTimer } from '../utils/scheduling';

// Helper to format time with seconds
function formatTimeForTimerWithSeconds(seconds: number): string {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}h${m > 0 ? ` ${m}m` : ''}${s > 0 ? ` ${s}s` : ''}`;
  } else if (m > 0) {
    return `${m}m${s > 0 ? ` ${s}s` : ''}`;
  } else {
    return `${s}s`;
  }
}

interface StudyTimerProps {
  currentTask: Task | null;
  currentSession?: { allocatedHours: number, planDate?: string, sessionNumber?: number } | null;
  onTimerComplete: (taskId: string, timeSpent: number) => void;
  planDate?: string;
  sessionNumber?: number;
  onMarkSessionDone?: (planDate: string, sessionNumber: number) => void;
  timer: TimerState;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerStop: () => void;
  onTimerReset: () => void;
  onTimerSpeedUp: () => void;
  onTimerUpdateTime: (newTimeInSeconds: number) => void;
  // New props for completion flow
  onContinueWithNextSession?: () => void;
  onTakeBreak?: () => void;
  onReviewCompletedWork?: () => void;
  // Additional props for progress tracking
  studyPlans?: any[];
  tasks?: Task[];
}

const StudyTimer: React.FC<StudyTimerProps> = ({
  currentTask,
  currentSession,
  onTimerComplete,
  planDate,
  sessionNumber,
  onMarkSessionDone,
  timer,
  onTimerStart,
  onTimerPause,
  onTimerStop,
  onTimerReset,
  onTimerSpeedUp,
  onTimerUpdateTime,
  onContinueWithNextSession,
  onTakeBreak,
  onReviewCompletedWork,
  studyPlans,
  tasks
}) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    timeSpent: number;
    taskTitle: string;
    sessionNumber: number;
  } | null>(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');

  const handleStart = () => {
    onTimerStart();
  };

  const handlePause = () => {
    onTimerPause();
  };

  const handleStop = () => {
    onTimerStop();
  };

  const handleReset = () => {
    onTimerReset();
  };

  const progressPercentage = timer.totalTime > 0 ? ((timer.totalTime - timer.currentTime) / timer.totalTime) * 100 : 0;

  // This component should only be rendered when currentTask is not null
  // The "Select a task" message is now handled in App.tsx
  if (!currentTask) {
    return null; // This should never happen, but TypeScript needs this check
  }

  const handleMarkSessionDone = () => {
    if (planDate && sessionNumber !== undefined && onMarkSessionDone) {
      onMarkSessionDone(planDate, sessionNumber);
      
      // Show completion modal with data
      setCompletionData({
        timeSpent: timer.totalTime - timer.currentTime,
        taskTitle: currentTask?.title || '',
        sessionNumber: sessionNumber
      });
      setShowCompletionModal(true);
    } else {
      onTimerComplete(currentTask?.id || '', timer.totalTime);
    }
  };

  const handleContinueWithNext = () => {
    setShowCompletionModal(false);
    if (onContinueWithNextSession) {
      onContinueWithNextSession();
    }
  };

  const handleTakeBreak = () => {
    setShowCompletionModal(false);
    if (onTakeBreak) {
      onTakeBreak();
    }
  };

  const handleReviewWork = () => {
    setShowCompletionModal(false);
    if (onReviewCompletedWork) {
      onReviewCompletedWork();
    }
  };

  const handleTimerClick = () => {
    if (!timer.isRunning && timer.currentTime > 0) {
      setIsEditingTime(true);
      setCustomTimeInput(formatCustomTimeInput(timer.currentTime));
    }
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTimeInput(e.target.value);
  };

  const handleTimeInputSubmit = () => {
    const newTimeInSeconds = parseCustomTimeInput(customTimeInput);
    if (newTimeInSeconds >= 0 && newTimeInSeconds <= timer.totalTime) {
      // Update the timer current time without affecting total time (session duration)
      onTimerUpdateTime(newTimeInSeconds);
      // Small delay to ensure state update completes
      setTimeout(() => {
        setIsEditingTime(false);
        setCustomTimeInput('');
      }, 50);
    } else {
      // Invalid input - show the total time as maximum
      alert(`Please enter a time between 0 and ${formatCustomTimeInput(timer.totalTime)}`);
    }
  };

  const handleTimeInputCancel = () => {
    setIsEditingTime(false);
    setCustomTimeInput('');
  };

  // Format seconds to MM:SS or HH:MM:SS for input
  const formatCustomTimeInput = (seconds: number): string => {
    const totalSeconds = Math.max(0, Math.round(seconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  };

  // Parse input like "25:30" or "1:25:30" to seconds
  const parseCustomTimeInput = (input: string): number => {
    const parts = input.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Task Info */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 dark:bg-gray-900 dark:shadow-gray-900">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white truncate">
              {currentTask.title}
            </h2>
            {currentSession && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Session {currentSession.sessionNumber} • {formatTimeForTimer(currentSession.allocatedHours)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 dark:bg-gray-900 dark:shadow-gray-900">
        <div className="text-center">
          <div className="mb-6">
            {isEditingTime ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={customTimeInput}
                  onChange={handleTimeInputChange}
                  placeholder="MM:SS or HH:MM:SS"
                  className="text-2xl sm:text-3xl font-bold text-center bg-gray-50 dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg px-4 py-2 text-gray-800 dark:text-white focus:outline-none focus:border-blue-500 w-full max-w-xs mx-auto"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTimeInputSubmit();
                    if (e.key === 'Escape') handleTimeInputCancel();
                  }}
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleTimeInputSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Set Time
                  </button>
                  <button
                    onClick={handleTimeInputCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter time in MM:SS format (e.g., 25:00) or HH:MM:SS (e.g., 1:25:30)
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`text-4xl sm:text-6xl lg:text-8xl font-bold text-gray-800 dark:text-white mb-2 ${
                    !timer.isRunning && timer.currentTime > 0 ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''
                  }`}
                  onClick={handleTimerClick}
                  title={!timer.isRunning && timer.currentTime > 0 ? 'Click to edit timer' : ''}
                >
                  {formatTimeForTimerWithSeconds(timer.currentTime)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {timer.isRunning ? 'Time Remaining' : timer.currentTime === 0 ? 'Timer Complete' : 'Paused'}
                  {!timer.isRunning && timer.currentTime > 0 && (
                    <span className="block text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Click timer to edit
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 dark:bg-gray-700">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 sm:h-4 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
            {!timer.isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-4 sm:px-6 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 text-sm sm:text-base font-semibold"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 sm:px-6 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 text-sm sm:text-base font-semibold"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={handleStop}
              className="flex items-center space-x-2 bg-gray-500 text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm sm:text-base font-semibold"
            >
              <Square className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Stop</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center space-x-2 bg-gray-300 text-gray-700 py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-400 transition-all duration-200 text-sm sm:text-base font-semibold dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Reset</span>
            </button>

          </div>

          {/* Session Actions */}
          {timer.currentTime <= 0.5 && (
            <div className="space-y-3">
              <button
                onClick={handleMarkSessionDone}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base font-semibold"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Mark Session Complete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completion Flow */}
      {showCompletionModal && completionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Session Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Great job completing your session for <span className="font-semibold">{completionData.taskTitle}</span>
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <span className="font-semibold">Time spent:</span> {formatTimeForTimerWithSeconds(completionData.timeSpent)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleContinueWithNext}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Continue with Next Session</span>
              </button>

              <button
                onClick={handleTakeBreak}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Coffee className="w-4 h-4" />
                <span>Take a Break</span>
              </button>

              <button
                onClick={handleReviewWork}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Review Completed Work</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTimer;
