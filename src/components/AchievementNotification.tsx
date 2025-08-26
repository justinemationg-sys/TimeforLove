import React, { useState, useEffect } from 'react';
import { Trophy, X, Star, Sparkles } from 'lucide-react';
import { Achievement } from '../types-gamification';

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss,
  autoHide = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [animationsActive, setAnimationsActive] = useState(true);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setAnimationsActive(false); // Stop all animations immediately
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          bg: 'from-gray-400 to-gray-500',
          text: 'text-gray-800',
          border: 'border-gray-300',
          glow: 'shadow-gray-200'
        };
      case 'rare':
        return {
          bg: 'from-blue-400 to-blue-600',
          text: 'text-blue-900',
          border: 'border-blue-300',
          glow: 'shadow-blue-200'
        };
      case 'epic':
        return {
          bg: 'from-purple-400 to-purple-600',
          text: 'text-purple-900',
          border: 'border-purple-300',
          glow: 'shadow-purple-200'
        };
      case 'legendary':
        return {
          bg: 'from-yellow-400 to-amber-500',
          text: 'text-yellow-900',
          border: 'border-yellow-300',
          glow: 'shadow-yellow-200'
        };
      default:
        return {
          bg: 'from-gray-400 to-gray-500',
          text: 'text-gray-800',
          border: 'border-gray-300',
          glow: 'shadow-gray-200'
        };
    }
  };

  const colors = getRarityColors(achievement.rarity);

  return (
    <div className={`fixed top-4 right-4 z-[9999] transition-all duration-500 transform ${
      isVisible && !isLeaving 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 ${colors.border}
        ${colors.glow} dark:shadow-none overflow-hidden max-w-sm relative
        ${animationsActive ? 'animate-glow' : ''}
      `}>
        {/* Animated background */}
        <div className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-10 ${animationsActive ? 'animate-pulse' : ''}`}></div>

        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {animationsActive && [...Array(6)].map((_, i) => (
            <Sparkles
              key={i}
              size={12}
              className={`absolute text-yellow-400 animate-ping opacity-70`}
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 15}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full bg-gradient-to-r ${colors.bg} shadow-lg`}>
                <Trophy size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Achievement Unlocked!
                </h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.text} bg-gradient-to-r ${colors.bg} text-white`}>
                  {achievement.rarity?.toUpperCase() || 'COMMON'}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Achievement Details */}
          <div className="flex items-center space-x-4">
            <div className={`text-4xl ${animationsActive ? 'animate-bounce' : ''}`}>
              {achievement.icon}
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-1">
                {achievement.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {achievement.description}
              </p>
              
              <div className="flex items-center space-x-2">
                <Star size={14} className="text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  +{achievement.points} points
                </span>
              </div>
            </div>
          </div>

          {/* Celebration message */}
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium text-center">
              🎉 Awesome work! Keep up the great progress! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Motivational toast component for encouragement
interface MotivationalToastProps {
  message: string;
  icon: string;
  type: 'encouragement' | 'celebration' | 'tip' | 'reminder';
  onDismiss: () => void;
  duration?: number;
}

export const MotivationalToast: React.FC<MotivationalToastProps> = ({
  message,
  icon,
  type,
  onDismiss,
  duration = 4000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'encouragement':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300';
      case 'celebration':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300';
      case 'tip':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300';
      case 'reminder':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`
        p-4 rounded-lg border shadow-lg max-w-sm ${getTypeColors(type)}
      `}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
