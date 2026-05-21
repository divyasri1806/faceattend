import { useEffect, useState, useCallback } from 'react';
import { Users, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import AttendanceBadge from '../components/AttendanceBadge';
import { fetchPersons, fetchTodayAttendance } from '../lib/attendance';
import type { AttendanceLog, Person } from '../types';

export default function Dashboard() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, l] = await Promise.all([fetchPersons(), fetchTodayAttendance()]);
    setPersons(p);
    setLogs(l);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const presentCount = logs.filter(l => l.status === 'present').length;
  const lateCount = logs.filter(l => l.status === 'late').length;
  const rate = persons.length > 0 ? Math.round(((presentCount + lateCount) / persons.length) * 100) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Today's attendance overview</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Registered" value={persons.length} icon={Users} color="sky" />
        <StatCard label="Present Today" value={presentCount} icon={CheckCircle} color="emerald" />
        <StatCard label="Late Arrivals" value={lateCount} icon={Clock} color="amber" />
        <StatCard label="Attendance Rate" value={`${rate}%`} icon={TrendingUp} color={rate >= 75 ? 'emerald' : 'rose'} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Today's Attendance Log</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No attendance records for today yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sky-700 font-semibold text-sm">
                    {log.persons?.name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{log.persons?.name ?? 'Unknown'}</p>
                  <p className="text-gray-400 text-xs truncate">{log.persons?.department}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <AttendanceBadge status={log.status} />
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 w-16">
                  <p className="text-xs text-gray-500 font-mono">{Math.round(log.confidence * 100)}%</p>
                  <p className="text-gray-300 text-xs">match</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
