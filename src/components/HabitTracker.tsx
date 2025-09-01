import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Habit } from '../types';
import { getLocalDateString } from '../utils/scheduling';

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (habit: { title: string; cadence: 'daily' | 'weekly'; targetPerWeek?: number; reminder?: boolean }) => void;
  onToggleHabitToday: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

export default function HabitTracker({ habits, onAddHabit, onToggleHabitToday, onDeleteHabit }: HabitTrackerProps) {
  const [title, setTitle] = useState('');
  const [cadence, setCadence] = useState<'daily' | 'weekly'>('daily');
  const [targetPerWeek, setTargetPerWeek] = useState(3);

  const today = getLocalDateString();

  const handleAdd = () => {
    const t = title.trim();
    if (!t) return;
    onAddHabit({ title: t, cadence, targetPerWeek: cadence === 'weekly' ? Math.max(1, targetPerWeek) : undefined });
    setTitle('');
  };

  const weeklyProgress = (habit: Habit) => {
    if (habit.cadence !== 'weekly') return 0;
    const now = new Date(today);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const count = habit.history.filter(d => {
      const dd = new Date(d);
      return dd >= startOfWeek && dd <= endOfWeek;
    }).length;
    return count;
  };

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => a.title.localeCompare(b.title));
  }, [habits]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 dark:bg-gray-900 dark:shadow-gray-900">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2 dark:text-white">
        <span>Habits</span>
      </h2>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New habit (e.g., Read 10 pages)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white"
        />
        <select
          value={cadence}
          onChange={(e) => setCadence(e.target.value as any)}
          className="border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        {cadence === 'weekly' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Target/week</label>
            <input
              type="number"
              min={1}
              max={7}
              value={targetPerWeek}
              onChange={(e) => setTargetPerWeek(Math.max(1, Math.min(7, parseInt(e.target.value || '1'))))}
              className="w-20 border rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white"
            />
          </div>
        )}
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {sortedHabits.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-6">No habits yet. Add your first habit!</div>
      ) : (
        <div className="space-y-3">
          {sortedHabits.map((habit) => {
            const doneToday = habit.history.includes(today);
            const weeklyDone = weeklyProgress(habit);
            const weeklyTarget = habit.cadence === 'weekly' ? (habit.targetPerWeek || 1) : undefined;

            return (
              <div key={habit.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white">{habit.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {habit.cadence === 'daily' ? 'Daily' : `Weekly${weeklyTarget ? ` • ${weeklyDone}/${weeklyTarget}` : ''}`}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Streak: {habit.streak}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {doneToday ? 'Done today' : 'Not done today'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleHabitToday(habit.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border ${doneToday ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    title={doneToday ? 'Mark as not done' : 'Mark as done today'}
                  >
                    <CheckCircle2 size={16} /> {doneToday ? 'Done' : 'Mark done'}
                  </button>
                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900"
                    title="Delete habit"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
