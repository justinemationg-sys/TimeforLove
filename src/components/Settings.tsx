import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, AlertTriangle, Calendar, Zap, Sun, Plus, Trash2, Edit3 } from 'lucide-react';
import { UserSettings, StudyPlan, DateSpecificStudyWindow, DaySpecificStudyWindow, DaySpecificStudyHours } from '../types';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onRestartTutorial?: () => void;
  hasTasks?: boolean;
  highlightStudyPlanMode?: boolean; // New prop to highlight study plan mode during tutorial
  studyPlans?: StudyPlan[]; // New prop to check for missed sessions
  canChangeSetting?: (settingKey: string) => boolean; // New prop to check if a setting can be changed
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onUpdateSettings, 
  darkMode, 
  onToggleDarkMode, 
  onRestartTutorial, 
  hasTasks = true, 
  highlightStudyPlanMode = false, 
  studyPlans = [],
  canChangeSetting = () => true
}) => {
  const [dailyAvailableHours, setDailyAvailableHours] = useState(settings?.dailyAvailableHours ?? 6);
  const [workDays, setWorkDays] = useState<number[]>(settings?.workDays || [0, 1, 2, 3, 4, 5, 6]);
  const [bufferDays, setBufferDays] = useState(settings?.bufferDays ?? 0);
  const [minSessionLength, setMinSessionLength] = useState(settings?.minSessionLength || 15);
  const [bufferTimeBetweenSessions, setBufferTimeBetweenSessions] = useState(settings?.bufferTimeBetweenSessions ?? 0);
  const [studyWindowStartHour, setStudyWindowStartHour] = useState(settings?.studyWindowStartHour || 6);
  const [studyWindowEndHour, setStudyWindowEndHour] = useState(settings?.studyWindowEndHour || 23);
  const [studyPlanMode, setStudyPlanMode] = useState(settings?.studyPlanMode || 'even');
  const [dateSpecificStudyWindows, setDateSpecificStudyWindows] = useState<DateSpecificStudyWindow[]>(settings?.dateSpecificStudyWindows || []);
  const [daySpecificStudyWindows, setDaySpecificStudyWindows] = useState<DaySpecificStudyWindow[]>(settings?.daySpecificStudyWindows || []);
  const [daySpecificStudyHours, setDaySpecificStudyHours] = useState<DaySpecificStudyHours[]>(settings?.daySpecificStudyHours || []);

  // State for date-specific override form
  const [showDateSpecificForm, setShowDateSpecificForm] = useState(false);
  // State for day-specific override form
  const [showDaySpecificForm, setShowDaySpecificForm] = useState(false);
  const [editingOverride, setEditingOverride] = useState<DateSpecificStudyWindow | null>(null);
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideStartHour, setNewOverrideStartHour] = useState(6);
  const [newOverrideEndHour, setNewOverrideEndHour] = useState(23);

  // State for day-specific override form
  const [editingDayOverride, setEditingDayOverride] = useState<DaySpecificStudyWindow | null>(null);
  const [newDayOverrideDayOfWeek, setNewDayOverrideDayOfWeek] = useState(1); // Default to Monday
  const [newDayOverrideStartHour, setNewDayOverrideStartHour] = useState(6);
  const [newDayOverrideEndHour, setNewDayOverrideEndHour] = useState(23);

  // State for day-specific study hours form
  const [showDaySpecificHoursForm, setShowDaySpecificHoursForm] = useState(false);
  const [editingDayHours, setEditingDayHours] = useState<DaySpecificStudyHours | null>(null);
  const [newDayHoursDayOfWeek, setNewDayHoursDayOfWeek] = useState(1); // Default to Monday
  const [newDayHoursStudyHours, setNewDayHoursStudyHours] = useState(4);

  // State for toggling day-specific hours section visibility
  const [showDaySpecificHoursSection, setShowDaySpecificHoursSection] = useState(
    settings?.showDaySpecificHoursSection ??
    ((settings?.daySpecificStudyHours && settings.daySpecificStudyHours.length > 0) || false)
  );

  // Update local state when settings prop changes (e.g., on initial load or external update)
  useEffect(() => {
    if (!settings) return; // Guard against null settings

    setDailyAvailableHours(settings.dailyAvailableHours ?? 6);
    setWorkDays(settings.workDays || [0, 1, 2, 3, 4, 5, 6]);
    setBufferDays(settings.bufferDays ?? 0);
    setMinSessionLength(settings.minSessionLength || 15);
    setBufferTimeBetweenSessions(settings.bufferTimeBetweenSessions ?? 0);
    setStudyWindowStartHour(settings.studyWindowStartHour || 6);
    setStudyWindowEndHour(settings.studyWindowEndHour || 23);
    setStudyPlanMode(settings.studyPlanMode || 'even');
    setDateSpecificStudyWindows(settings.dateSpecificStudyWindows || []);
    setDaySpecificStudyWindows(settings.daySpecificStudyWindows || []);
    setDaySpecificStudyHours(settings.daySpecificStudyHours || []);

    // Load persisted toggle preference, or default to expanded if user has day-specific hours
    setShowDaySpecificHoursSection(
      settings.showDaySpecificHoursSection ??
      ((settings.daySpecificStudyHours && settings.daySpecificStudyHours.length > 0) || false)
    );
  }, [settings]);

  // Enhanced validation functions with better error prevention
  const validateStudyWindow = () => {
    if (studyWindowStartHour >= studyWindowEndHour) {
      return {
        isValid: false,
        message: "End time must be after start time."
      };
    }
    if (studyWindowStartHour < 0 || studyWindowStartHour > 23) {
      return {
        isValid: false,
        message: "Start time must be between 0 and 23."
      };
    }
    if (studyWindowEndHour < 0 || studyWindowEndHour > 23) {
      return {
        isValid: false,
        message: "End time must be between 0 and 23."
      };
    }
    return { isValid: true, message: "" };
  };

  const validateDailyHoursVsStudyWindow = () => {
    const studyWindowHours = studyWindowEndHour - studyWindowStartHour;
    if (studyWindowHours < dailyAvailableHours) {
      return {
        isValid: false,
        message: `Your study window (${studyWindowHours} hours) is shorter than your daily available hours (${dailyAvailableHours} hours). This will prevent TimePilot from scheduling all your planned study time.`
      };
    }
    return { isValid: true, message: "" };
  };

  const validateDailyHours = () => {
    if (dailyAvailableHours <= 0) {
      return {
        isValid: false,
        message: "Daily available hours must be greater than 0."
      };
    }
    if (dailyAvailableHours > 24) {
      return {
        isValid: false,
        message: "Daily available hours cannot exceed 24 hours."
      };
    }
    return { isValid: true, message: "" };
  };

  const validateMinSessionLength = () => {
    if (minSessionLength < 5) {
      return {
        isValid: false,
        message: "Minimum session length must be at least 5 minutes."
      };
    }
    if (minSessionLength > 480) { // 8 hours
      return {
        isValid: false,
        message: "Minimum session length cannot exceed 8 hours."
      };
    }
    return { isValid: true, message: "" };
  };

  const validateBufferTime = () => {
    const studyWindowHours = studyWindowEndHour - studyWindowStartHour;
    const totalBufferTimeHours = (bufferTimeBetweenSessions * Math.ceil(dailyAvailableHours / (minSessionLength / 60))) / 60;
    const effectiveStudyTime = studyWindowHours - totalBufferTimeHours;
    
    if (effectiveStudyTime < dailyAvailableHours) {
      return {
        isValid: false,
        message: `With your current buffer time settings, you may not have enough effective study time. Consider reducing buffer time or increasing your study window.`
      };
    }
    return { isValid: true, message: "" };
  };

  const validateWorkDays = () => {
    if (workDays.length === 0) {
      return {
        isValid: false,
        message: "You must select at least one work day."
      };
    }
    return { isValid: true, message: "" };
  };



  const getValidationMessages = () => {
    const messages = [];
    
    const dailyHoursValidation = validateDailyHours();
    if (!dailyHoursValidation.isValid) {
      messages.push({ type: 'error', message: dailyHoursValidation.message });
    }
    
    const workDaysValidation = validateWorkDays();
    if (!workDaysValidation.isValid) {
      messages.push({ type: 'error', message: workDaysValidation.message });
    }
    
    const minSessionValidation = validateMinSessionLength();
    if (!minSessionValidation.isValid) {
      messages.push({ type: 'error', message: minSessionValidation.message });
    }
    
    const windowValidation = validateStudyWindow();
    if (!windowValidation.isValid) {
      messages.push({ type: 'error', message: windowValidation.message });
    }
    
    const hoursValidation = validateDailyHoursVsStudyWindow();
    if (!hoursValidation.isValid) {
      messages.push({ type: 'warning', message: hoursValidation.message });
    }
    
    const bufferValidation = validateBufferTime();
    if (!bufferValidation.isValid) {
      messages.push({ type: 'warning', message: bufferValidation.message });
    }
    
    return messages;
  };

  const validationMessages = getValidationMessages();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    onUpdateSettings({
      dailyAvailableHours,
      workDays,
      bufferDays,
      minSessionLength,
      bufferTimeBetweenSessions,
      studyWindowStartHour,
      studyWindowEndHour,
      shortBreakDuration: settings.shortBreakDuration || 5,
      longBreakDuration: settings.longBreakDuration || 15,
      maxConsecutiveHours: settings.maxConsecutiveHours || 4,
      avoidTimeRanges: settings.avoidTimeRanges || [],
      weekendStudyHours: settings.weekendStudyHours || 4,
      autoCompleteSessions: settings.autoCompleteSessions || false,
      enableNotifications: settings.enableNotifications !== false,
      studyPlanMode,
      dateSpecificStudyWindows,
      daySpecificStudyWindows,
      daySpecificStudyHours,
      showDaySpecificHoursSection
    });
  };

  const handleWorkDayChange = (dayIndex: number) => {
    setWorkDays(prevDays =>
      prevDays.includes(dayIndex)
        ? prevDays.filter(day => day !== dayIndex)
        : [...prevDays, dayIndex].sort((a, b) => a - b)
    );
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Handle day-specific hours section toggle with immediate save
  const handleToggleDaySpecificHoursSection = () => {
    const newToggleState = !showDaySpecificHoursSection;
    setShowDaySpecificHoursSection(newToggleState);

    // Immediately save the toggle preference
    onUpdateSettings({
      ...settings,
      dailyAvailableHours,
      workDays,
      bufferDays,
      minSessionLength,
      bufferTimeBetweenSessions,
      studyWindowStartHour,
      studyWindowEndHour,
      studyPlanMode,
      dateSpecificStudyWindows,
      daySpecificStudyWindows,
      daySpecificStudyHours,
      showDaySpecificHoursSection: newToggleState
    });
  };

  // Helper function to check if a setting is disabled
  const isSettingDisabled = (settingKey: string) => {
    return !canChangeSetting(settingKey);
  };

  // Helper function to get disabled styling
  const getDisabledStyling = (settingKey: string) => {
    return isSettingDisabled(settingKey) 
      ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' 
      : '';
  };

  // Date-specific study window handlers
  const handleAddDateSpecificOverride = () => {
    if (!newOverrideDate) return;
    
    // Check if override for this date already exists
    const existingIndex = dateSpecificStudyWindows.findIndex(override => override.date === newOverrideDate);
    
    if (existingIndex !== -1) {
      // Update existing override
      const updatedOverrides = [...dateSpecificStudyWindows];
      updatedOverrides[existingIndex] = {
        date: newOverrideDate,
        startHour: newOverrideStartHour,
        endHour: newOverrideEndHour,
        isActive: true
      };
      setDateSpecificStudyWindows(updatedOverrides);
    } else {
      // Add new override
      const newOverride: DateSpecificStudyWindow = {
        date: newOverrideDate,
        startHour: newOverrideStartHour,
        endHour: newOverrideEndHour,
        isActive: true
      };
      setDateSpecificStudyWindows([...dateSpecificStudyWindows, newOverride]);
    }
    
    // Reset form
    setNewOverrideDate('');
    setNewOverrideStartHour(6);
    setNewOverrideEndHour(23);
    setShowDateSpecificForm(false);
    setEditingOverride(null);
  };

  const handleEditDateSpecificOverride = (override: DateSpecificStudyWindow) => {
    setEditingOverride(override);
    setNewOverrideDate(override.date);
    setNewOverrideStartHour(override.startHour);
    setNewOverrideEndHour(override.endHour);
    setShowDateSpecificForm(true);
  };

  const handleDeleteDateSpecificOverride = (date: string) => {
    setDateSpecificStudyWindows(dateSpecificStudyWindows.filter(override => override.date !== date));
  };

  const handleToggleOverrideActive = (date: string) => {
    const updatedOverrides = dateSpecificStudyWindows.map(override =>
      override.date === date
        ? { ...override, isActive: !override.isActive }
        : override
    );
    setDateSpecificStudyWindows(updatedOverrides);
  };

  // Day-specific study window handlers
  const handleAddDaySpecificOverride = () => {
    const validation = validateDaySpecificOverride();
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    // Check if override for this day already exists
    const existingIndex = daySpecificStudyWindows.findIndex(override => override.dayOfWeek === newDayOverrideDayOfWeek);

    if (existingIndex !== -1) {
      // Update existing override
      const updatedOverrides = [...daySpecificStudyWindows];
      updatedOverrides[existingIndex] = {
        dayOfWeek: newDayOverrideDayOfWeek,
        startHour: newDayOverrideStartHour,
        endHour: newDayOverrideEndHour,
        isActive: true
      };
      setDaySpecificStudyWindows(updatedOverrides);
    } else {
      // Add new override
      const newOverride: DaySpecificStudyWindow = {
        dayOfWeek: newDayOverrideDayOfWeek,
        startHour: newDayOverrideStartHour,
        endHour: newDayOverrideEndHour,
        isActive: true
      };
      setDaySpecificStudyWindows([...daySpecificStudyWindows, newOverride]);
    }

    // Reset form
    setNewDayOverrideDayOfWeek(1);
    setNewDayOverrideStartHour(6);
    setNewDayOverrideEndHour(23);
    setEditingDayOverride(null);
    setShowDaySpecificForm(false);
  };

  const handleEditDaySpecificOverride = (override: DaySpecificStudyWindow) => {
    setEditingDayOverride(override);
    setNewDayOverrideDayOfWeek(override.dayOfWeek);
    setNewDayOverrideStartHour(override.startHour);
    setNewDayOverrideEndHour(override.endHour);
    setShowDaySpecificForm(true);
  };

  const handleDeleteDaySpecificOverride = (dayOfWeek: number) => {
    setDaySpecificStudyWindows(daySpecificStudyWindows.filter(override => override.dayOfWeek !== dayOfWeek));
  };

  const handleToggleDayOverrideActive = (dayOfWeek: number) => {
    const updatedOverrides = daySpecificStudyWindows.map(override =>
      override.dayOfWeek === dayOfWeek
        ? { ...override, isActive: !override.isActive }
        : override
    );
    setDaySpecificStudyWindows(updatedOverrides);
  };

  // Day-specific study hours handlers
  const handleAddDaySpecificHours = () => {
    const validation = validateDaySpecificHours();
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    let updatedHours;
    // Check if hours for this day already exists
    const existingIndex = daySpecificStudyHours.findIndex(hours => hours.dayOfWeek === newDayHoursDayOfWeek);

    if (existingIndex !== -1) {
      // Update existing hours
      updatedHours = [...daySpecificStudyHours];
      updatedHours[existingIndex] = {
        dayOfWeek: newDayHoursDayOfWeek,
        studyHours: newDayHoursStudyHours,
        isActive: true
      };
    } else {
      // Add new day-specific hours
      const newHours: DaySpecificStudyHours = {
        dayOfWeek: newDayHoursDayOfWeek,
        studyHours: newDayHoursStudyHours,
        isActive: true
      };
      updatedHours = [...daySpecificStudyHours, newHours];
    }

    setDaySpecificStudyHours(updatedHours);

    // Immediately save the changes
    onUpdateSettings({
      ...settings,
      dailyAvailableHours,
      workDays,
      bufferDays,
      minSessionLength,
      bufferTimeBetweenSessions,
      studyWindowStartHour,
      studyWindowEndHour,
      studyPlanMode,
      dateSpecificStudyWindows,
      daySpecificStudyWindows,
      daySpecificStudyHours: updatedHours,
      showDaySpecificHoursSection
    });

    // Reset form
    setShowDaySpecificHoursForm(false);
    setEditingDayHours(null);
    setNewDayHoursDayOfWeek(1);
    setNewDayHoursStudyHours(4);
  };

  const handleEditDaySpecificHours = (hours: DaySpecificStudyHours) => {
    setEditingDayHours(hours);
    setNewDayHoursDayOfWeek(hours.dayOfWeek);
    setNewDayHoursStudyHours(hours.studyHours);
    setShowDaySpecificHoursForm(true);
  };

  const handleDeleteDaySpecificHours = (dayOfWeek: number) => {
    const updatedHours = daySpecificStudyHours.filter(hours => hours.dayOfWeek !== dayOfWeek);
    setDaySpecificStudyHours(updatedHours);

    // Immediately save the changes
    onUpdateSettings({
      ...settings,
      dailyAvailableHours,
      workDays,
      bufferDays,
      minSessionLength,
      bufferTimeBetweenSessions,
      studyWindowStartHour,
      studyWindowEndHour,
      studyPlanMode,
      dateSpecificStudyWindows,
      daySpecificStudyWindows,
      daySpecificStudyHours: updatedHours,
      showDaySpecificHoursSection
    });
  };

  const handleToggleDayHoursActive = (dayOfWeek: number) => {
    const updatedHours = daySpecificStudyHours.map(hours =>
      hours.dayOfWeek === dayOfWeek
        ? { ...hours, isActive: !hours.isActive }
        : hours
    );
    setDaySpecificStudyHours(updatedHours);

    // Immediately save the changes
    onUpdateSettings({
      ...settings,
      dailyAvailableHours,
      workDays,
      bufferDays,
      minSessionLength,
      bufferTimeBetweenSessions,
      studyWindowStartHour,
      studyWindowEndHour,
      studyPlanMode,
      dateSpecificStudyWindows,
      daySpecificStudyWindows,
      daySpecificStudyHours: updatedHours,
      showDaySpecificHoursSection
    });
  };

  const formatTimeDisplay = (hour: number): string => {
    return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const validateDateSpecificOverride = (): { isValid: boolean; message: string } => {
    if (!newOverrideDate) {
      return { isValid: false, message: 'Please select a date.' };
    }
    if (newOverrideStartHour >= newOverrideEndHour) {
      return { isValid: false, message: 'End time must be after start time.' };
    }
    return { isValid: true, message: '' };
  };

  const validateDaySpecificOverride = (): { isValid: boolean; message: string } => {
    if (newDayOverrideStartHour >= newDayOverrideEndHour) {
      return { isValid: false, message: 'End time must be after start time.' };
    }
    return { isValid: true, message: '' };
  };

  const validateDaySpecificHours = (): { isValid: boolean; message: string } => {
    if (newDayHoursStudyHours <= 0) {
      return { isValid: false, message: 'Study hours must be greater than 0.' };
    }
    if (newDayHoursStudyHours > 24) {
      return { isValid: false, message: 'Study hours cannot exceed 24 hours.' };
    }

    // Check if there's a day-specific window for this day and validate against it
    const dayWindow = daySpecificStudyWindows.find(w => w.dayOfWeek === newDayHoursDayOfWeek && w.isActive);
    if (dayWindow) {
      const windowHours = dayWindow.endHour - dayWindow.startHour;
      if (newDayHoursStudyHours > windowHours) {
        return {
          isValid: false,
          message: `Study hours (${newDayHoursStudyHours}h) cannot exceed the study window duration (${windowHours}h) for ${getDayName(newDayHoursDayOfWeek)}.`
        };
      }
    }

    return { isValid: true, message: '' };
  };

  const cancelDateSpecificForm = () => {
    setShowDateSpecificForm(false);
    setEditingOverride(null);
    setNewOverrideDate('');
    setNewOverrideStartHour(6);
    setNewOverrideEndHour(23);
  };

  const cancelDaySpecificForm = () => {
    setShowDaySpecificForm(false);
    setEditingDayOverride(null);
    setNewDayOverrideDayOfWeek(1);
    setNewDayOverrideStartHour(6);
    setNewDayOverrideEndHour(23);
  };

  // Show loading state if settings is null
  if (!settings) {
    return (
      <div className="backdrop-blur-md bg-white/80 dark:bg-black/40 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 border border-white/20 dark:border-white/10">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600 dark:text-gray-400">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/80 dark:bg-black/40 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 border border-white/20 dark:border-white/10">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
          <SettingsIcon className="text-white" size={18} />
        </div>
        <span>Your Study Preferences</span>
      </h2>

      {/* Validation Messages */}
      {validationMessages.length > 0 && (
        <div className="mb-6 space-y-3">
          {validationMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 p-4 rounded-2xl backdrop-blur-sm border ${
                msg.type === 'error'
                  ? 'bg-red-500/10 border-red-300/50 dark:border-red-500/30'
                  : 'bg-yellow-500/10 border-yellow-300/50 dark:border-yellow-500/30'
              }`}
            >
              <AlertTriangle 
                size={16} 
                className={`mt-0.5 ${
                  msg.type === 'error' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} 
              />
              <p className={`text-sm ${
                msg.type === 'error' 
                  ? 'text-red-700 dark:text-red-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Two Column Layout for Main Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
        {/* Daily Available Hours */}
        <div className="backdrop-blur-sm bg-white/50 dark:bg-white/5 rounded-2xl p-5 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="dailyHours" className="flex text-sm font-semibold text-gray-700 dark:text-gray-200 items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Clock size={14} className="text-white" />
                  </div>
                  <span>How many hours can you study per day?</span>
                </label>
                <button
                  type="button"
                  onClick={handleToggleDaySpecificHoursSection}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center gap-1.5"
                  title={showDaySpecificHoursSection ? "Hide day-specific hours" : "Set different hours for specific days"}
                >
                  <Calendar size={12} />
                  {showDaySpecificHoursSection ? 'Hide Day-Specific' : 'Day-Specific Hours'}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">This includes all your study time for the day.</p>
          <input
            type="number"
            id="dailyHours"
            value={dailyAvailableHours}
            onChange={(e) => setDailyAvailableHours(Number(e.target.value))}
            min="1"
            max="24"
            disabled={isSettingDisabled('dailyAvailableHours')}
            className={`block w-full backdrop-blur-sm bg-white/70 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm dark:text-white transition-all duration-300 ${getDisabledStyling('dailyAvailableHours')}`}
            required
          />
        </div>

        {/* Day-Specific Study Hours */}
        {showDaySpecificHoursSection && (
        <div className="backdrop-blur-sm bg-white/50 dark:bg-white/5 rounded-2xl p-5 border border-white/20 dark:border-white/10 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10">
          <div className="flex items-center justify-between mb-3">
            <label className="flex text-sm font-semibold text-gray-700 dark:text-gray-200 items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Calendar size={14} className="text-white" />
              </div>
              <span>Day-Specific Study Hours</span>
            </label>
            <button
              type="button"
              onClick={() => setShowDaySpecificHoursForm(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center gap-1.5"
            >
              <Plus size={12} />
              Add Day
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Set different study hour targets for specific days of the week. If not set, the default daily hours will be used.
          </p>

          {/* Existing Day-Specific Hours */}
          {daySpecificStudyHours.length > 0 && (
            <div className="space-y-2 mb-4">
              {daySpecificStudyHours.map((hours) => (
                <div
                  key={hours.dayOfWeek}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${hours.isActive
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${hours.isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      {getDayName(hours.dayOfWeek)}
                    </span>
                    <span className={`text-sm ${hours.isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {hours.studyHours}h
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${hours.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => handleToggleDayHoursActive(hours.dayOfWeek)}
                    >
                      {hours.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditDaySpecificHours(hours)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Edit hours"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDaySpecificHours(hours.dayOfWeek)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete hours"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Day-Specific Hours Form */}
          {showDaySpecificHoursForm && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                {editingDayHours ? 'Edit' : 'Add'} Day-Specific Hours
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={newDayHoursDayOfWeek}
                    onChange={(e) => setNewDayHoursDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Study Hours
                  </label>
                  <input
                    type="number"
                    value={newDayHoursStudyHours}
                    onChange={(e) => setNewDayHoursStudyHours(Number(e.target.value))}
                    min="0.5"
                    max="24"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDaySpecificHoursForm(false);
                    setEditingDayHours(null);
                    setNewDayHoursDayOfWeek(1);
                    setNewDayHoursStudyHours(4);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddDaySpecificHours}
                  className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                  {editingDayHours ? 'Update' : 'Add'} Hours
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Buffer Days */}
        <div>
              <label htmlFor="bufferDays" className="flex text-sm font-medium text-gray-700 mb-1 items-center space-x-2 dark:text-gray-200">
                <Sun size={16} className="text-gray-500 dark:text-gray-400" />
            <span>How many days before the deadline do you want to finish each task?</span>
          </label>
              <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">This creates a buffer, so tasks are completed ahead of time.</p>
          <input
            type="number"
            id="bufferDays"
            value={bufferDays}
            onChange={(e) => setBufferDays(Number(e.target.value))}
            min="0"
            disabled={isSettingDisabled('bufferDays')}
            className={`block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${getDisabledStyling('bufferDays')}`}
            required
          />
        </div>

        {/* Minimum Session Length */}
        <div>
              <label htmlFor="minSessionLength" className="flex text-sm font-medium text-gray-700 mb-1 items-center space-x-2 dark:text-gray-200">
                <Clock size={16} className="text-gray-500 dark:text-gray-400" />
            <span>Minimum Session Length</span>
          </label>
              <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">The shortest session that can be scheduled. Sessions shorter than this will be distributed intelligently or skipped to maintain accuracy.</p>
          <select
            id="minSessionLength"
            value={minSessionLength}
            onChange={(e) => setMinSessionLength(Number(e.target.value))}
            disabled={isSettingDisabled('minSessionLength')}
            className={`block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${getDisabledStyling('minSessionLength')}`}
          >
            <option value={5}>5 minutes (micro-tasks)</option>
            <option value={10}>10 minutes (quick tasks)</option>
            <option value={15}>15 minutes (standard)</option>
            <option value={20}>20 minutes (focused work)</option>
            <option value={30}>30 minutes (deep work)</option>
          </select>
        </div>

        {/* Buffer Time Between Sessions */}
        <div>
              <label htmlFor="bufferTimeBetweenSessions" className="flex text-sm font-medium text-gray-700 mb-1 items-center space-x-2 dark:text-gray-200">
                <Clock size={16} className="text-gray-500 dark:text-gray-400" />
            <span>Buffer Time Between Sessions</span>
          </label>
              <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Add buffer time between study sessions for mental breaks, transitions, and to prevent burnout.</p>
          <select
            id="bufferTimeBetweenSessions"
            value={bufferTimeBetweenSessions}
            onChange={(e) => setBufferTimeBetweenSessions(Number(e.target.value))}
            disabled={isSettingDisabled('bufferTimeBetweenSessions')}
            className={`block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${getDisabledStyling('bufferTimeBetweenSessions')}`}
          >
            <option value={0}>No buffer</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Work Days Selection */}
            <div className="calendar-settings-section">
              <label className="flex text-sm font-medium text-gray-700 mb-1 items-center space-x-2 dark:text-gray-200">
                <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                <span>Which days are your primary study days?</span>
              </label>
              <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Study plans will primarily be generated for these days.</p>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-1">
                {dayNames.map((dayName, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleWorkDayChange(index)}
                    disabled={isSettingDisabled('workDays')}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200
                      ${workDays.includes(index)
                        ? 'bg-blue-600 text-white shadow-md dark:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                      } ${isSettingDisabled('workDays') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {dayName.substring(0, 3)} {/* Display short day name */}
                  </button>
                ))}
              </div>
        </div>

        {/* Study Window Settings */}
            <div className="space-y-2 study-window-section">
          <div>
                <label className="flex text-sm font-medium text-gray-700 mb-1 items-center space-x-2 dark:text-gray-200">
                  <Clock size={16} className="text-gray-500 dark:text-gray-400" />
              <span>Study Window</span>
            </label>
                <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Define when you're available to study each day. Sessions will only be scheduled within this time window.</p>
          </div>
          
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Study Window Start */}
            <div>
              <label htmlFor="studyWindowStart" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Start Time
              </label>
              <select
                id="studyWindowStart"
                value={studyWindowStartHour}
                onChange={(e) => setStudyWindowStartHour(Number(e.target.value))}
                disabled={isSettingDisabled('studyWindowStartHour')}
                className={`block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${getDisabledStyling('studyWindowStartHour')}`}
              >
                {Array.from({length: 24}, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                  </option>
                ))}
              </select>
            </div>

            {/* Study Window End */}
            <div>
              <label htmlFor="studyWindowEnd" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                End Time
              </label>
              <select
                id="studyWindowEnd"
                value={studyWindowEndHour}
                onChange={(e) => setStudyWindowEndHour(Number(e.target.value))}
                disabled={isSettingDisabled('studyWindowEndHour')}
                className={`block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${getDisabledStyling('studyWindowEndHour')}`}
              >
                {Array.from({length: 24}, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
              {/* Study Window Summary */}
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                <strong>Study Window:</strong> {studyWindowStartHour === 0 ? '12 AM' : studyWindowStartHour < 12 ? `${studyWindowStartHour} AM` : studyWindowStartHour === 12 ? '12 PM' : `${studyWindowStartHour - 12} PM`} - {studyWindowEndHour === 0 ? '12 AM' : studyWindowEndHour < 12 ? `${studyWindowEndHour} AM` : studyWindowEndHour === 12 ? '12 PM' : `${studyWindowEndHour - 12} PM`} ({studyWindowEndHour - studyWindowStartHour} hours available)
              </div>
        </div>

        {/* Toggle Buttons for Date-Specific and Day-Specific Study Windows */}
        <div className="flex flex-wrap gap-2 mt-4 mb-2">
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            onClick={() => setShowDateSpecificForm(!showDateSpecificForm)}
          >
            {showDateSpecificForm ? 'Hide' : 'Show'} Date-Specific Study Windows
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            onClick={() => setShowDaySpecificForm(!showDaySpecificForm)}
          >
            {showDaySpecificForm ? 'Hide' : 'Show'} Day-Specific Study Windows
          </button>
        </div>

          {showDateSpecificForm && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-gray-700 dark:text-gray-200">Date-Specific Study Windows</strong>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Override your default study window for specific dates. Useful for holidays,
                    special events, or days with different schedules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDateSpecificForm(!showDateSpecificForm)}
                  className="flex items-center px-2 py-1 text-xs text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none"
                >
                  <Plus size={14} className="mr-1" />
                  {showDateSpecificForm ? 'Cancel' : 'Add Override'}
                </button>
              </div>

              {showDateSpecificForm && (
                <div className="my-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="overrideDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Date
                      </label>
                      <input
                        type="date"
                        id="overrideDate"
                        value={newOverrideDate}
                        onChange={(e) => setNewOverrideDate(e.target.value)}
                        className="mt-1 block w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="overrideStartTime" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Start Time
                      </label>
                      <select
                        id="overrideStartTime"
                        value={newOverrideStartHour}
                        onChange={(e) => setNewOverrideStartHour(parseInt(e.target.value))}
                        className="mt-1 block w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="overrideEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        End Time
                      </label>
                      <select
                        id="overrideEndTime"
                        value={newOverrideEndHour}
                        onChange={(e) => setNewOverrideEndHour(parseInt(e.target.value))}
                        className="mt-1 block w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleAddDateSpecificOverride}
                  >
                    Save Override
                  </button>
                </div>
              )}

              {dateSpecificStudyWindows.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {dateSpecificStudyWindows.map((override) => (
                    <li key={override.date} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-md shadow">
                      <div className="text-sm">
                        <strong className="text-gray-700 dark:text-gray-200">{override.date}</strong>
                        <span className="mx-2 text-gray-500">|</span>
                        {formatTimeDisplay(override.startHour)} - {formatTimeDisplay(override.endHour)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-full p-2"
                          onClick={() => handleEditDateSpecificOverride(override)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="bg-red-100 text-red-700 hover:bg-red-200 rounded-full p-2"
                          onClick={() => handleDeleteDateSpecificOverride(override.date)}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 text-xs font-medium rounded-full ${override.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                          onClick={() => handleToggleOverrideActive(override.date)}
                        >
                          {override.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No date-specific overrides.</p>
              )}
            </div>
          )}

          {showDaySpecificForm && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-gray-700 dark:text-gray-200">Day-Specific Study Windows</strong>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Override your default study window for specific days of the week.
                    Set different hours for each day (e.g., shorter hours on weekends).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDaySpecificForm(!showDaySpecificForm)}
                  className="flex items-center px-2 py-1 text-xs text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none"
                >
                  <Plus size={14} className="mr-1" />
                  {showDaySpecificForm ? 'Cancel' : 'Add Override'}
                </button>
              </div>

              {showDaySpecificForm && (
                <div className="my-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Day of Week
                      </label>
                      <select
                        id="dayOfWeek"
                        value={newDayOverrideDayOfWeek}
                        onChange={(e) => setNewDayOverrideDayOfWeek(Number(e.target.value))}
                        className="mt-1 block w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dayStartTime" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Start Time
                      </label>
                      <select
                        id="dayStartTime"
                        value={newDayOverrideStartHour}
                        onChange={(e) => setNewDayOverrideStartHour(Number(e.target.value))}
                        className="mt-1 block w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dayEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        End Time
                      </label>
                      <select
                        id="dayEndTime"
                        value={newDayOverrideEndHour}
                        onChange={(e) => setNewDayOverrideEndHour(Number(e.target.value))}
                        className="mt-1 block w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleAddDaySpecificOverride}
                  >
                    Save Override
                  </button>
                </div>
              )}

              {daySpecificStudyWindows.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {daySpecificStudyWindows.map((override) => (
                    <li key={override.dayOfWeek} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-md shadow">
                      <div className="text-sm">
                        <strong className="text-gray-700 dark:text-gray-200">{getDayName(override.dayOfWeek)}</strong>
                        <span className="mx-2 text-gray-500">|</span>
                        {formatTimeDisplay(override.startHour)} - {formatTimeDisplay(override.endHour)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-full p-2"
                          onClick={() => handleEditDaySpecificOverride(override)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="bg-red-100 text-red-700 hover:bg-red-200 rounded-full p-2"
                          onClick={() => handleDeleteDaySpecificOverride(override.dayOfWeek)}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 text-xs font-medium rounded-full ${override.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                          onClick={() => handleToggleDayOverrideActive(override.dayOfWeek)}
                        >
                          {override.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No day-specific overrides.</p>
              )}
            </div>
          )}

        {/* Study Plan Mode */}
            <div className={`space-y-4 ${highlightStudyPlanMode ? 'ring-2 ring-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50 rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">Study Plan Mode</label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Choose how TimePilot schedules your study sessions</p>
              </div>

              {/* Dropdown for Study Plan Mode */}
              <div className="space-y-3">
                <select
                  value={studyPlanMode}
                  onChange={(e) => setStudyPlanMode(e.target.value as 'eisenhower' | 'even' | 'balanced')}
                  disabled={isSettingDisabled('studyPlanMode')}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    isSettingDisabled('studyPlanMode') ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="eisenhower">🎯 Eisenhower Matrix - Priority Focus</option>
                  <option value="even">⚖️ Evenly Distributed - Frequency Friendly</option>
                  <option value="balanced">🔄 Balanced Priority - Smart Mix</option>
                </select>
              </div>


            </div>
          </div>
        </div>


        {/* Full Width Sections */}
        <div className="space-y-3">
        {/* Dark Mode Toggle */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Zap size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
              <button
                type="button"
                onClick={onToggleDarkMode}
                disabled={isSettingDisabled('darkMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-200'
                } ${isSettingDisabled('darkMode') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Tutorial Restart */}
        {onRestartTutorial && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Need Help?
                </span>
              </div>
              <button
                type="button"
                onClick={onRestartTutorial}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {!hasTasks ? 'Start Tutorial' : 'Restart Tutorial'}
              </button>
            </div>
            {!hasTasks && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The tutorial will guide you through adding your first task and using TimePilot effectively.
              </p>
            )}
          </div>
        )}



        {/* Save Button */}
          <div className="pt-6 border-t border-white/20 dark:border-white/10">
          <button
            type="submit"
              disabled={validationMessages.some(msg => msg.type === 'error')}
              className={`w-full inline-flex justify-center py-4 px-6 border-none shadow-lg text-sm font-semibold rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all duration-300 ${
                validationMessages.some(msg => msg.type === 'error')
                  ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105'
              }`}
          >
            {validationMessages.some(msg => msg.type === 'error')
              ? 'Handle Sessions First'
              : 'Save Settings'
            }
          </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
