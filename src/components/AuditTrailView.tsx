import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  Shield,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  UserCheck,
  Edit3,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Eye,
  X,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../services/authContext';
import { StorageService } from '../services/storage';
import { ActivityLogItem, ChurchBranch, CHURCH_BRANCHES, UserRole } from '../types';

export const AuditTrailView: React.FC = () => {
  const { isAdmin, currentUser, activeBranch } = useAuth();

  const [logs, setLogs] = useState<ActivityLogItem[]>(() => StorageService.getActivity());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'child' | 'team' | 'attendance' | 'auth'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshLogs = () => {
    setLogs(StorageService.getActivity());
  };

  // Restrict to Administrators
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Access Restricted to Administrators
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          In compliance with church safeguarding and governance standards, the system audit trail is accessible exclusively to authorized church administrators.
        </p>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = logs;
    const term = searchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter(
        l =>
          l.action.toLowerCase().includes(term) ||
          l.details.toLowerCase().includes(term) ||
          l.userName.toLowerCase().includes(term) ||
          (l.targetEntity && l.targetEntity.toLowerCase().includes(term)) ||
          l.branch.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(l => l.type === categoryFilter);
    }

    if (branchFilter !== 'all') {
      result = result.filter(l => l.branch === branchFilter);
    }

    return result;
  }, [logs, searchTerm, categoryFilter, branchFilter]);

  // Metric counts
  const childActionsCount = logs.filter(l => l.type === 'child').length;
  const teamActionsCount = logs.filter(l => l.type === 'team').length;
  const attendanceActionsCount = logs.filter(l => l.type === 'attendance').length;

  // Format relative time helper
  const getRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 2) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  // Export Audit Trail to Excel
  const handleExportAuditTrail = () => {
    const data = filteredLogs.map(l => ({
      'Log ID': l.id,
      'Timestamp': l.timestamp,
      'Actor Name': l.userName,
      'Actor Role': l.userRole,
      'Branch': l.branch,
      'Category': l.type.toUpperCase(),
      'Action': l.action,
      'Target Entity': l.targetEntity || 'N/A',
      'Details': l.details,
      'Severity': l.severity || 'info'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');
    XLSX.writeFile(workbook, `Shelter_JC_Audit_Trail_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Clear Logs
  const handleClearLogs = () => {
    StorageService.clearActivityLogs();
    refreshLogs();
    setIsConfirmClearOpen(false);
    setFeedbackMsg('Audit trail logs have been cleared.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const getActionBadge = (log: ActivityLogItem) => {
    const actionLower = log.action.toLowerCase();
    if (actionLower.includes('deleted') || actionLower.includes('removed') || log.severity === 'danger') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Trash2 className="w-3 h-3" />
          <span>{log.action}</span>
        </span>
      );
    }
    if (actionLower.includes('approved') || actionLower.includes('registered') || log.severity === 'success') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>{log.action}</span>
        </span>
      );
    }
    if (actionLower.includes('updated') || actionLower.includes('modified') || log.severity === 'warning') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Edit3 className="w-3 h-3" />
          <span>{log.action}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <FileText className="w-3 h-3" />
        <span>{log.action}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              System Audit Trail
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Admin Governance
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable log of all system actions: child profile updates, deletions, and team approvals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refreshLogs}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportAuditTrail}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Log (Excel)</span>
          </button>
          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="px-3 py-2 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            title="Clear audit trail records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Logs</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total System Events</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{logs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all 3 branches</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Child Updates & Deletions</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{childActionsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Profile modifications & deletions</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Team Approvals & Roles</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{teamActionsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Staff approvals & permissions</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Attendance Sessions</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{attendanceActionsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Service roll calls saved</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by action, child name, staff member, or details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Action Categories</option>
              <option value="child">Child Updates & Deletions</option>
              <option value="team">Team Management & Approvals</option>
              <option value="attendance">Attendance Sessions</option>
              <option value="auth">Sign-In & Registrations</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="sm:col-span-3">
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Church Branches</option>
              {CHURCH_BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Showing {filteredLogs.length} of {logs.length} audit trail records</span>
          {(searchTerm || categoryFilter !== 'all' || branchFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setBranchFilter('all');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No audit records match your filters</h3>
            <p className="mt-1">Try clearing your search term or selecting another category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Staff Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {getRelativeTime(log.timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.timestamp.slice(11, 16)} • {log.timestamp.slice(0, 10)}
                        </div>
                      </td>

                      {/* Staff Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            log.userRole === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {log.userName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight text-xs">
                              {log.userName}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                              {log.userRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log)}
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-4 font-semibold text-slate-800 text-xs whitespace-nowrap">
                        {log.targetEntity || <span className="text-slate-400 font-normal">—</span>}
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {log.branch}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {log.details}
                      </td>

                      {/* View Action */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Log Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED AUDIT ENTRY MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Audit Record #{selectedLog.id}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Event Description</span>
                <p className="text-slate-800 font-medium leading-relaxed">{selectedLog.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Actor</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedLog.userName}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{selectedLog.userRole}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Church Branch</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedLog.branch}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Entity</span>
                  <div className="font-bold text-indigo-700 mt-0.5">{selectedLog.targetEntity || 'None'}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Timestamp</span>
                  <div className="font-mono text-slate-800 mt-0.5">{selectedLog.timestamp}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR AUDIT LOGS MODAL */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-slate-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Clear Audit Trail?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              This will wipe all activity logs from the browser storage. We recommend exporting an Excel copy first for church archives.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLogs}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
              >
                Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
