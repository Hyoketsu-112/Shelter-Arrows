import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Save,
  Check,
  History,
  TrendingUp,
  UserCheck,
  UserX,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService, formatDate } from '../services/storage';
import { Child, AttendanceStatus, AttendanceRecord } from '../types';

export const AttendanceView: React.FC = () => {
  const { activeBranch, currentUser, isAdmin } = useAuth();
  
  const [tab, setTab] = useState<'take' | 'history'>('take');
  const [attendanceDate, setAttendanceDate] = useState<string>(() => formatDate(new Date()));
  const [serviceTopic, setServiceTopic] = useState('');
  const [attendanceEntries, setAttendanceEntries] = useState<Record<string, { status: AttendanceStatus; notes?: string }>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const children = StorageService.getChildren().filter(c => c.branch === activeBranch);
  const historyRecords = StorageService.getAttendance().filter(a => a.branch === activeBranch);

  // Load existing record for selected date if already saved
  useEffect(() => {
    const existing = historyRecords.find(r => r.date === attendanceDate);
    if (existing) {
      setServiceTopic(existing.serviceTopic || '');
      const map: Record<string, { status: AttendanceStatus; notes?: string }> = {};
      existing.entries.forEach(e => {
        map[e.childId] = { status: e.status, notes: e.notes };
      });
      // also ensure any children added since are in map
      children.forEach(c => {
        if (!map[c.id]) {
          map[c.id] = { status: 'present' };
        }
      });
      setAttendanceEntries(map);
    } else {
      // Default all to 'present' for convenient church roll call
      const map: Record<string, { status: AttendanceStatus; notes?: string }> = {};
      children.forEach(c => {
        map[c.id] = { status: 'present' };
      });
      setAttendanceEntries(map);
      setServiceTopic('');
    }
    setSaveSuccess(false);
  }, [attendanceDate, activeBranch]);

  const handleStatusChange = (childId: string, status: AttendanceStatus) => {
    setAttendanceEntries(prev => ({
      ...prev,
      [childId]: { ...prev[childId], status }
    }));
  };

  const handleNotesChange = (childId: string, notes: string) => {
    setAttendanceEntries(prev => ({
      ...prev,
      [childId]: { ...prev[childId], notes }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; notes?: string }> = {};
    children.forEach(c => {
      updated[c.id] = { ...attendanceEntries[c.id], status };
    });
    setAttendanceEntries(updated);
  };

  const handleSaveAttendance = () => {
    const entries = children.map(c => ({
      childId: c.id,
      childName: c.fullName,
      status: attendanceEntries[c.id]?.status || 'present',
      notes: attendanceEntries[c.id]?.notes
    }));

    StorageService.saveAttendanceRecord({
      branch: activeBranch,
      date: attendanceDate,
      serviceTopic: serviceTopic.trim() || undefined,
      recordedBy: {
        id: currentUser?.id || 'staff',
        name: currentUser?.fullName || 'Teacher'
      },
      entries
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Quick date pickers (Today or Last Sunday)
  const setDateToToday = () => {
    setAttendanceDate(formatDate(new Date()));
  };

  const setDateToLastSunday = () => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday
    const diff = day === 0 ? 0 : day; // days back to Sunday
    d.setDate(d.getDate() - diff);
    setAttendanceDate(formatDate(d));
  };

  // Stats calculation
  const totalRoster = children.length;
  const presentCount = Object.values(attendanceEntries).filter(e => e?.status === 'present').length;
  const absentCount = Object.values(attendanceEntries).filter(e => e?.status === 'absent').length;
  const excusedCount = Object.values(attendanceEntries).filter(e => e?.status === 'excused').length;
  const attendanceRate = totalRoster > 0 ? Math.round((presentCount / totalRoster) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Children's Attendance
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activeBranch}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record service attendance, monitor presence rates, and track historical participation.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab('take')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === 'take'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Take Roll Call
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance History ({historyRecords.length})
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Attendance Saved Successfully!</div>
            <div>{presentCount} of {totalRoster} children marked present for {attendanceDate}.</div>
          </div>
        </div>
      )}

      {/* TAB 1: TAKE ATTENDANCE */}
      {tab === 'take' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Date, Service Topic, Quick Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* Date Input */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Date
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={e => setAttendanceDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={setDateToToday}
                    className="px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={setDateToLastSunday}
                    className="px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                  >
                    Sunday
                  </button>
                </div>
              </div>

              {/* Service Topic / Lesson Input */}
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lesson Topic / Memory Verse (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. David and Goliath - 1 Samuel 17"
                  value={serviceTopic}
                  onChange={e => setServiceTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Save Button */}
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Attendance</span>
                </button>
              </div>

            </div>

            {/* Quick Stats & Mark All Shortcuts */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Present: {presentCount}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-rose-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Absent: {absentCount}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Excused: {excusedCount}</span>
                </div>
                <span className="text-slate-400">|</span>
                <span className="font-extrabold text-indigo-700">
                  {attendanceRate}% Presence Rate
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 font-medium">Quick Mark:</span>
                <button
                  onClick={() => handleMarkAll('present')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors"
                >
                  All Present
                </button>
                <button
                  onClick={() => handleMarkAll('absent')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 transition-colors"
                >
                  All Absent
                </button>
              </div>

            </div>
          </div>

          {/* Children Attendance Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {children.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No children registered yet in {activeBranch}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Child Name</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {children.map((child, index) => {
                      const status = attendanceEntries[child.id]?.status || 'present';
                      const notes = attendanceEntries[child.id]?.notes || '';

                      return (
                        <tr key={child.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {child.fullName}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              child.gender === 'Female' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {child.gender}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl space-x-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(child.id, 'present')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(child.id, 'absent')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(child.id, 'excused')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'excused'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Excused
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder={status === 'excused' ? 'e.g. Traveling / sick' : 'Optional notes'}
                              value={notes}
                              onChange={e => handleNotesChange(child.id, e.target.value)}
                              className="w-full max-w-xs px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Past Attendance Sessions ({activeBranch})</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Review saved records, lesson topics, and attendance rates for church services.
            </p>

            {historyRecords.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No past attendance records found for {activeBranch}. Take roll call on the first tab to begin logging.
              </div>
            ) : (
              <div className="space-y-3">
                {historyRecords.map(rec => {
                  const present = rec.entries.filter(e => e.status === 'present').length;
                  const total = rec.entries.length;
                  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                  const isExpanded = expandedHistoryId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className="border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-all"
                    >
                      <div
                        onClick={() => setExpandedHistoryId(isExpanded ? null : rec.id)}
                        className="p-4 bg-slate-50 hover:bg-slate-100/60 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center font-mono">
                            {rec.date.slice(8, 10)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                              <span>Service Date: {rec.date}</span>
                              {rec.serviceTopic && (
                                <span className="text-xs font-normal text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  {rec.serviceTopic}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Recorded by: {rec.recordedBy.name}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-bold text-slate-800 text-sm">
                              {present} / {total} Children ({pct}%)
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {rec.entries.filter(e => e.status === 'absent').length} Absent • {rec.entries.filter(e => e.status === 'excused').length} Excused
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded child list */}
                      {isExpanded && (
                        <div className="p-4 bg-white border-t border-slate-200">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Session Attendee Breakdown
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {rec.entries.map((entry, idx) => (
                              <div
                                key={idx}
                                className={`p-2 rounded-lg border flex items-center justify-between ${
                                  entry.status === 'present'
                                    ? 'bg-emerald-50/50 border-emerald-200'
                                    : entry.status === 'absent'
                                      ? 'bg-rose-50/50 border-rose-200'
                                      : 'bg-amber-50/50 border-amber-200'
                                }`}
                              >
                                <div>
                                  <span className="font-semibold text-slate-800">{entry.childName}</span>
                                  {entry.notes && (
                                    <div className="text-[10px] text-slate-500">{entry.notes}</div>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                                  entry.status === 'present'
                                    ? 'bg-emerald-600 text-white'
                                    : entry.status === 'absent'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-amber-500 text-white'
                                }`}>
                                  {entry.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
