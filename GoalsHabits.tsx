import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle, Circle, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Goal = Database['public']['Tables']['user_goals']['Row'];

export function GoalsHabits() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal: '',
    target_amount: '',
    target_date: '',
    priority: '1'
  });

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(data);
    }
  };

  const addGoal = async () => {
    if (!user || !newGoal.goal) return;

    const { error } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        goal: newGoal.goal,
        target_amount: newGoal.target_amount ? parseFloat(newGoal.target_amount) : null,
        target_date: newGoal.target_date || null,
        priority: parseInt(newGoal.priority),
        status: 'active'
      });

    if (!error) {
      setNewGoal({ goal: '', target_amount: '', target_date: '', priority: '1' });
      setShowAddGoal(false);
      loadGoals();
    }
  };

  const toggleGoalStatus = async (goalId: string, currentStatus: string) => {
    if (!user) return;

    const newStatus = currentStatus === 'active' ? 'completed' : 'active';

    const { error } = await supabase
      .from('user_goals')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', goalId);

    if (!error) {
      loadGoals();
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId);

    if (!error) {
      loadGoals();
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Goals & Habits</h2>
              <p className="text-sm text-slate-500">Track your financial goals</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {showAddGoal && (
          <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50 space-y-3">
            <h3 className="font-semibold text-slate-800 mb-3">Add New Goal</h3>
            <input
              type="text"
              placeholder="Goal description"
              value={newGoal.goal}
              onChange={(e) => setNewGoal({ ...newGoal, goal: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Target amount (optional)"
                value={newGoal.target_amount}
                onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <input
                type="date"
                placeholder="Target date (optional)"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="1">Low Priority</option>
              <option value="2">Medium Priority</option>
              <option value="3">High Priority</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={addGoal}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Add Goal
              </button>
              <button
                onClick={() => setShowAddGoal(false)}
                className="px-6 bg-slate-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeGoals.length === 0 && completedGoals.length === 0 && !showAddGoal && (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No goals yet</p>
            <p className="text-sm">Start by adding your first financial goal</p>
          </div>
        )}

        {activeGoals.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Active Goals</h3>
            <div className="space-y-3">
              {activeGoals.map(goal => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-green-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleGoalStatus(goal.id, goal.status)}
                      className="mt-1 text-slate-400 hover:text-green-600 transition"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 mb-2">{goal.goal}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        {goal.target_amount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {goal.target_amount.toFixed(2)}
                          </span>
                        )}
                        {goal.target_date && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          goal.priority === 3 ? 'bg-red-100 text-red-700' :
                          goal.priority === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {goal.priority === 3 ? 'High' : goal.priority === 2 ? 'Medium' : 'Low'} Priority
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedGoals.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Completed Goals</h3>
            <div className="space-y-3">
              {completedGoals.map(goal => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl border-2 border-green-200 bg-green-50"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleGoalStatus(goal.id, goal.status)}
                      className="mt-1 text-green-600 hover:text-slate-400 transition"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-slate-700 line-through mb-2">{goal.goal}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        {goal.target_amount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {goal.target_amount.toFixed(2)}
                          </span>
                        )}
                        {goal.target_date && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
