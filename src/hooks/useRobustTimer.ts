import { useEffect, useRef, useCallback } from 'react';
import { TimerState } from '../types';
import { showTimerCompletionNotification, playTimerAlert } from '../utils/timer-notifications';

interface UseRobustTimerProps {
  timer: TimerState;
  onTimerUpdate: (newTimer: TimerState) => void;
  onTimerComplete?: () => void;
  taskTitle?: string; // For notifications
}

/**
 * Robust timer hook that works even when the browser tab is inactive
 * Uses Page Visibility API and high-resolution timing to maintain accuracy
 */
export const useRobustTimer = ({ timer, onTimerUpdate, onTimerComplete, taskTitle }: UseRobustTimerProps) => {
  const rafId = useRef<number>();
  const intervalId = useRef<number>();
  const wasRunning = useRef(false);
  const lastVisibilityChange = useRef<number>(performance.now());
  const hasCompletedRef = useRef(false);

  // Calculate the actual current time based on elapsed time since start
  const calculateActualTime = useCallback((timerState: TimerState): number => {
    if (!timerState.isRunning || !timerState.startTime) {
      return timerState.currentTime;
    }

    const now = performance.now();
    const elapsedSinceStart = (now - timerState.startTime) / 1000; // Convert to seconds
    const pausedTime = timerState.pausedTime || 0;
    const actualElapsed = elapsedSinceStart - pausedTime;
    const remainingTime = Math.max(0, timerState.totalTime - actualElapsed);

    return remainingTime;
  }, []);

  // Update timer display using RAF for smooth updates when visible
  const updateTimerDisplay = useCallback(() => {
    if (!timer.isRunning) {
      // Ensure RAF is cancelled if timer is not running
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = undefined;
      }
      return;
    }

    const actualTime = calculateActualTime(timer);
    const now = performance.now();

    // Only update if there's a meaningful change (> 0.1 seconds)
    if (Math.abs(actualTime - timer.currentTime) > 0.1) {
      const newTimer: TimerState = {
        ...timer,
        currentTime: actualTime,
        lastUpdateTime: now
      };

      onTimerUpdate(newTimer);

      // Check if timer completed (only trigger once)
      if (actualTime <= 0 && onTimerComplete && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        // Show notification and play alert if tab is hidden
        if (document.hidden && taskTitle) {
          const timeSpent = timer.totalTime - actualTime;
          showTimerCompletionNotification(taskTitle, timeSpent);
          playTimerAlert();
        }
        onTimerComplete();
        return;
      }
    }

    // Only continue animation loop if still running and no RAF is pending
    if (timer.isRunning && !rafId.current) {
      rafId.current = requestAnimationFrame(updateTimerDisplay);
    }
  }, [timer, calculateActualTime, onTimerUpdate, onTimerComplete]);

  // Handle visibility changes to maintain timer accuracy
  const handleVisibilityChange = useCallback(() => {
    const now = performance.now();
    // Fallback for browsers that don't support Page Visibility API
    const wasHidden = typeof document.hidden !== 'undefined' ? document.hidden : false;

    if (wasHidden) {
      // Tab became hidden - record the time
      lastVisibilityChange.current = now;
      wasRunning.current = timer.isRunning;
      
      // Cancel RAF since it won't work reliably in background
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = undefined;
      }

      // Use interval fallback for background updates (less frequent but more reliable)
      if (timer.isRunning) {
        intervalId.current = window.setInterval(() => {
          const actualTime = calculateActualTime(timer);
          if (actualTime <= 0 && onTimerComplete && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            if (intervalId.current) {
              clearInterval(intervalId.current);
              intervalId.current = undefined;
            }
            // Show notification when completing in background
            if (taskTitle) {
              const timeSpent = timer.totalTime - actualTime;
              showTimerCompletionNotification(taskTitle, timeSpent);
              playTimerAlert();
            }
            onTimerComplete();
          }
        }, 5000); // Check every 5 seconds in background
      }
    } else {
      // Tab became visible again
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = undefined;
      }

      if (wasRunning.current && timer.isRunning) {
        // Recalculate time based on actual elapsed time
        const actualTime = calculateActualTime(timer);
        
        const newTimer: TimerState = {
          ...timer,
          currentTime: actualTime,
          lastUpdateTime: now
        };

        onTimerUpdate(newTimer);

        // Check if timer completed while hidden (only trigger once)
        if (actualTime <= 0) {
          if (onTimerComplete && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onTimerComplete();
          }
        } else {
          // Resume RAF updates
          rafId.current = requestAnimationFrame(updateTimerDisplay);
        }
      }
    }
  }, [timer, calculateActualTime, onTimerUpdate, onTimerComplete, updateTimerDisplay]);

  // Reset completion flag when timer is reset, restarted, or new session starts
  useEffect(() => {
    // Reset when timer is reset to full duration
    if (timer.currentTime === timer.totalTime && !timer.isRunning) {
      hasCompletedRef.current = false;
    }
    // Also reset when starting a new session (totalTime or currentTaskId changes)
    // This ensures the flag is cleared when switching between tasks/sessions
    hasCompletedRef.current = false;
  }, [timer.totalTime, timer.currentTaskId]);

  // Start/stop timer effects
  useEffect(() => {
    // Always cancel any existing RAF/interval first to prevent race conditions
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = undefined;
    }
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = undefined;
    }

    if (timer.isRunning) {
      // Start RAF updates if page is visible
      if (!document.hidden) {
        rafId.current = requestAnimationFrame(updateTimerDisplay);
      }
    }

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = undefined;
      }
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = undefined;
      }
    };
  }, [timer.isRunning, updateTimerDisplay]);

  // Set up visibility change listeners
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for focus/blur as backup
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = undefined;
      }
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = undefined;
      }
    };
  }, []);
};

/**
 * Helper function to start a timer with proper timing data
 */
export const startTimer = (currentTimer: TimerState): TimerState => {
  const now = performance.now();
  return {
    ...currentTimer,
    isRunning: true,
    startTime: now,
    lastUpdateTime: now,
    pausedTime: currentTimer.pausedTime || 0
  };
};

/**
 * Helper function to pause a timer and track paused time
 */
export const pauseTimer = (currentTimer: TimerState): TimerState => {
  if (!currentTimer.isRunning || !currentTimer.startTime) {
    return { ...currentTimer, isRunning: false };
  }

  const now = performance.now();
  const elapsedSinceStart = (now - currentTimer.startTime) / 1000;
  const currentPausedTime = currentTimer.pausedTime || 0;
  const actualElapsed = elapsedSinceStart - currentPausedTime;
  const remainingTime = Math.max(0, currentTimer.totalTime - actualElapsed);

  return {
    ...currentTimer,
    isRunning: false,
    currentTime: remainingTime,
    lastUpdateTime: now
  };
};

/**
 * Helper function to resume a paused timer
 */
export const resumeTimer = (currentTimer: TimerState): TimerState => {
  const now = performance.now();
  
  if (currentTimer.startTime && currentTimer.lastUpdateTime) {
    // Calculate how long we were paused
    const pausedDuration = (now - currentTimer.lastUpdateTime) / 1000;
    const newPausedTime = (currentTimer.pausedTime || 0) + pausedDuration;
    
    return {
      ...currentTimer,
      isRunning: true,
      pausedTime: newPausedTime,
      lastUpdateTime: now
    };
  }

  // If no previous timing data, treat as new start
  return startTimer(currentTimer);
};

/**
 * Helper function to reset timer to initial state
 */
export const resetTimer = (currentTimer: TimerState): TimerState => {
  return {
    ...currentTimer,
    isRunning: false,
    currentTime: currentTimer.totalTime,
    startTime: undefined,
    pausedTime: undefined,
    lastUpdateTime: undefined
  };
};

/**
 * Helper function to update timer with new time (for manual editing)
 */
export const updateTimerTime = (currentTimer: TimerState, newTimeInSeconds: number): TimerState => {
  const newTime = Math.max(0, newTimeInSeconds);
  return {
    ...currentTimer,
    currentTime: newTime,
    totalTime: newTime, // Update totalTime so timer calculations use the edited value
    // Clear timing state when manually updating time
    startTime: undefined,
    pausedTime: undefined,
    lastUpdateTime: undefined
  };
};
