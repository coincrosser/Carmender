import { useState } from 'react';
import { X, Check, Calendar, DollarSign, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Bill = Database['public']['Tables']['bills']['Row'];

interface DayDetailProps {
  date: string;
  bills: Bill[];
  onClose: () => void;
  onUpdate: () => void;
}

export function DayDetail({ date, bills, onClose, onUpdate }: DayDetailProps) {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBill, setNewBill] = useState({
    description: '',
    amount: '',
    type: 'bill' as 'bill' | 'income' | 'reminder',
    note: ''
  });

  const dateObj = new Date(date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const updateBillStatus = async (billId: string, status: 'unpaid' | 'paid' | 'payment_arrangement') => {
    if (!user) return;

    const { error } = await supabase
      .from('bills')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', billId);

    if (!error) {
      onUpdate();
    }
  };

  const updatePADate = async (billId: string, paDate: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('bills')
      .update({
        pa_date: paDate,
        status: 'payment_arrangement',
        updated_at: new Date().toISOString()
      })
      .eq('id', billId);

    if (!error) {
      onUpdate();
    }
  };

  const addBill = async () => {
    if (!user || !newBill.description) return;

    const { error } = await supabase
      .from('bills')
      .insert({
        user_id: user.id,
        date,
        description: newBill.description,
        amount: newBill.amount ? parseFloat(newBill.amount) : null,
        type: newBill.type,
        note: newBill.note || null,
        status: 'unpaid'
      });

    if (!error) {
      setNewBill({ description: '', amount: '', type: 'bill', note: '' });
      setShowAddForm(false);
      onUpdate();
    }
  };

  const deleteBill = async (billId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);

    if (!error) {
      onUpdate();
    }
  };

  const totalBills = bills.filter(b => b.type === 'bill').reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalIncome = bills.filter(b => b.type === 'income').reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-card w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{formattedDate}</h2>
            {(totalBills > 0 || totalIncome > 0) && (
              <div className="flex gap-4 mt-2 text-sm">
                {totalBills > 0 && (
                  <span className="text-rose-600 font-semibold">Bills: ${totalBills.toFixed(2)}</span>
                )}
                {totalIncome > 0 && (
                  <span className="text-emerald-600 font-semibold">Income: ${totalIncome.toFixed(2)}</span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100/50 rounded-lg transition">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {bills.length === 0 && !showAddForm && (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items for this day</p>
            </div>
          )}

          {bills.map(bill => (
            <div
              key={bill.id}
              className={`p-5 rounded-xl border-2 transition shadow-sm ${
                bill.status === 'paid'
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 success-glow'
                  : bill.status === 'payment_arrangement'
                  ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300'
                  : 'bg-white/90 border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">{bill.description}</h3>
                  {bill.amount && (
                    <div className="flex items-center gap-1 text-lg font-bold text-slate-900">
                      <DollarSign className="w-4 h-4" />
                      {bill.amount.toFixed(2)}
                    </div>
                  )}
                  {bill.note && (
                    <p className="text-sm text-slate-600 mt-2">{bill.note}</p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      bill.type === 'bill' ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white' :
                      bill.type === 'income' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' :
                      'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'
                    }`}>
                      {bill.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteBill(bill.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateBillStatus(bill.id, bill.status === 'paid' ? 'unpaid' : 'paid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
                    bill.status === 'paid'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {bill.status === 'paid' ? 'Paid' : 'Mark Paid'}
                </button>

                <button
                  onClick={() => {
                    const newDate = prompt('Enter new payment arrangement date (YYYY-MM-DD):');
                    if (newDate) updatePADate(bill.id, newDate);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
                    bill.status === 'payment_arrangement'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {bill.status === 'payment_arrangement' ? `PA: ${bill.pa_date}` : 'Set PA'}
                </button>
              </div>
            </div>
          ))}

          {showAddForm && (
            <div className="p-5 rounded-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 space-y-3 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">Add New Item</h3>
              <input
                type="text"
                placeholder="Description"
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none bg-white shadow-sm"
              />
              <input
                type="number"
                placeholder="Amount (optional)"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none bg-white shadow-sm"
              />
              <select
                value={newBill.type}
                onChange={(e) => setNewBill({ ...newBill, type: e.target.value as any })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none bg-white shadow-sm"
              >
                <option value="bill">Bill</option>
                <option value="income">Income</option>
                <option value="reminder">Reminder</option>
              </select>
              <input
                type="text"
                placeholder="Note (optional)"
                value={newBill.note}
                onChange={(e) => setNewBill({ ...newBill, note: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none bg-white shadow-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={addBill}
                  className="flex-1 btn-growth text-white py-3 rounded-lg font-medium transition shadow-md"
                >
                  Add Item
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 bg-slate-200/80 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-300/80 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {!showAddForm && (
          <div className="p-6 border-t border-slate-200/50">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 btn-growth text-white py-4 rounded-xl font-medium transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
