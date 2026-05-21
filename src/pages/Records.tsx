import { useEffect, useState, useCallback } from 'react';
import { Calendar, Download, Search } from 'lucide-react';
import AttendanceBadge from '../components/AttendanceBadge';
import { fetchAttendanceByDate } from '../lib/attendance';
import type { AttendanceLog } from '../types';

export default function Records() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const data = await fetchAttendanceByDate(d);
    setLogs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const filtered = logs.filter(l =>
    !search || l.persons?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.persons?.department?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [
      ['Name', 'Role', 'Department', 'Status', 'Time', 'Confidence'],
      ...filtered.map(l => [
        l.persons?.name ?? '',
        l.persons?.role ?? '',
        l.persons?.department ?? '',
        l.status,
        new Date(l.timestamp).toLocaleTimeString(),
        `${Math.round(l.confidence * 100)}%`,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presentCount = filtered.filter(l => l.status === 'present').length;
  const lateCount = filtered.filter(l => l.status === 'late').length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
          <p className="text-gray-500 text-sm mt-1">View and export attendance history</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm text-gray-700 focus:outline-none"
          />
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or department..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 mb-6">
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex-1 text-center">
          <p className="text-emerald-600 text-xl font-bold">{presentCount}</p>
          <p className="text-emerald-500 text-xs font-medium">Present</p>
        </div>
        <div className="bg-amber-50 rounded-xl px-4 py-3 flex-1 text-center">
          <p className="text-amber-600 text-xl font-bold">{lateCount}</p>
          <p className="text-amber-500 text-xs font-medium">Late</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex-1 text-center">
          <p className="text-gray-700 text-xl font-bold">{filtered.length}</p>
          <p className="text-gray-500 text-xs font-medium">Total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
              <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="inline-block w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400 text-sm">
                  No records found for {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sky-700 font-bold text-xs">{log.persons?.name?.charAt(0).toUpperCase() ?? '?'}</span>
                      </div>
                      <span className="font-medium text-gray-800">{log.persons?.name ?? 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 capitalize text-gray-600">{log.persons?.role}</td>
                  <td className="px-4 py-3.5 text-gray-600">{log.persons?.department}</td>
                  <td className="px-4 py-3.5"><AttendanceBadge status={log.status} /></td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="font-mono text-sm text-gray-700">{Math.round(log.confidence * 100)}%</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
