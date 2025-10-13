import { useState, useEffect } from 'react';
import { MessageCircle, Calendar as CalendarIcon, LogOut, Bell } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Calendar } from './components/Calendar';
import { DayDetail } from './components/DayDetail';
import { AIChat } from './components/AIChat';
import { CalendarLegend } from './components/CalendarLegend';
import { GoalsHabits } from './components/GoalsHabits';
import { requestNotificationPermission, checkUpcomingBills } from './lib/notifications';
import { supabase } from './lib/supabase';
import type { Database } from './lib/database.types';

type Bill = Database['public']['Tables']['bills']['Row'];

function AppContent() {
  const { user, signOut } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<Bill[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      checkNotifications();
      checkBillReminders();
    }
  }, [user]);

  const checkNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission);
  };

  const checkBillReminders = async () => {
    if (!user) return;

    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', weekFromNow.toISOString().split('T')[0])
      .neq('status', 'paid');

    if (bills && bills.length > 0) {
      checkUpcomingBills(bills);
    }
  };

  const handleDayClick = (date: string, bills: Bill[]) => {
    setSelectedDate(date);
    setSelectedBills(bills);
  };

  const handleCloseDetail = () => {
    setSelectedDate(null);
    setSelectedBills([]);
  };

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
    handleCloseDetail();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return <Auth />;
  }

  if (showChat) {
    return <AIChat onClose={() => setShowChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Bill Calendar</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Sign out"
          >
            <LogOut className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-blue-100">
                Ready for your daily check-in? Let's talk about your finances and goals.
              </p>
            </div>
            {!notificationsEnabled && (
              <button
                onClick={checkNotifications}
                className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition text-sm"
              >
                <Bell className="w-4 h-4" />
                Enable Notifications
              </button>
            )}
          </div>
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Start Daily Check-in
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Calendar key={refreshKey} onDayClick={handleDayClick} />
          </div>
          <div className="space-y-6">
            <CalendarLegend />
          </div>
        </div>

        <GoalsHabits />
      </main>

      {selectedDate && (
        <DayDetail
          date={selectedDate}
          bills={selectedBills}
          onClose={handleCloseDetail}
          onUpdate={handleUpdate}
        />
      )}

      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-30"
        title="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
