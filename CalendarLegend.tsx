import { Check, Calendar, DollarSign, TrendingUp, Bell } from 'lucide-react';

export function CalendarLegend() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Calendar Key</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-2">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Paid</p>
            <p className="text-xs text-slate-500">All items for the day are paid</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-orange-100 rounded px-3 py-1">
            <span className="text-sm font-bold text-orange-700">PA</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Payment Arrangement</p>
            <p className="text-xs text-slate-500">New payment date set</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded px-3 py-1">
            <DollarSign className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Bill</p>
            <p className="text-xs text-slate-500">Payment due</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded px-3 py-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Income</p>
            <p className="text-xs text-slate-500">Expected money coming in</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded px-3 py-1">
            <Bell className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Reminder</p>
            <p className="text-xs text-slate-500">Important task or note</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </h4>
        <p className="text-sm text-blue-800">
          Get browser notifications for upcoming bills and reminders. Enable notifications in your browser settings for this site.
        </p>
      </div>
    </div>
  );
}
