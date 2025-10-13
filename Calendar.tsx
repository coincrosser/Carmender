import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Bill = Database['public']['Tables']['bills']['Row'];

interface CalendarProps {
  onDayClick: (date: string, bills: Bill[]) => void;
}

export function Calendar({ onDayClick }: CalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1));
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, [currentDate, user]);

  const loadBills = async () => {
    if (!user) return;

    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date');

    if (!error && data) {
      setBills(data);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getBillsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return bills.filter(bill => bill.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth();

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 border-b border-slate-200">
        {dayNames.map(day => (
          <div key={day} className="bg-slate-50 py-2 text-center text-xs font-medium text-slate-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="bg-white aspect-square" />;
          }

          const dayBills = getBillsForDay(day);
          const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            .toISOString()
            .split('T')[0];

          const allPaid = dayBills.length > 0 && dayBills.every(b => b.status === 'paid');
          const hasPA = dayBills.some(b => b.status === 'payment_arrangement');
          const totalAmount = dayBills.reduce((sum, b) => sum + (b.amount || 0), 0);

          return (
            <button
              key={day}
              onClick={() => onDayClick(dateStr, dayBills)}
              className="bg-white p-2 aspect-square hover:bg-slate-50 transition relative border-b border-r border-slate-100"
            >
              <div className="text-sm font-medium text-slate-700 mb-1">{day}</div>
              {dayBills.length > 0 && (
                <div className="text-xs space-y-1">
                  {allPaid && (
                    <div className="flex items-center justify-center">
                      <div className="bg-green-100 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                    </div>
                  )}
                  {hasPA && !allPaid && (
                    <div className="text-orange-600 font-medium">PA</div>
                  )}
                  <div className="text-slate-600 font-medium">
                    {dayBills.length} item{dayBills.length !== 1 ? 's' : ''}
                  </div>
                  {totalAmount > 0 && (
                    <div className="text-slate-500 text-xs">
                      ${totalAmount.toFixed(0)}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
