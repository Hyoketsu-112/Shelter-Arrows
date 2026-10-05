import React from 'react';
import {
  Users2,
  Cake,
  CalendarDays,
  ClipboardCheck,
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  UserPlus,
  FileSpreadsheet,
  AlertCircle,
  PartyPopper,
  Globe,
  Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../services/authContext';
import { StorageService, getBirthdayInfo } from '../services/storage';
import { Child, CHURCH_BRANCHES, ChurchBranch } from '../types';
import { QuickActionsFloatingButton } from './QuickActionsFloatingButton';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenAddChild: () => void;
  onOpenImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddChild,
  onOpenImport
}) => {
  const { activeBranch, setActiveBranch, isAdmin, isGlobalAdmin, currentUser } = useAuth();

  const allChildren = StorageService.getChildren();
  const branchChildren = allChildren.filter(c => c.branch === activeBranch);
  const attendanceRecords = StorageService.getAttendance().filter(a => a.branch === activeBranch);
  const activityLogs = StorageService.getActivity().filter(
    act => act.branch === activeBranch || currentUser?.role === 'admin' || currentUser?.role === 'global_admin'
  );

  const birthdayInfos = branchChildren.map(getBirthdayInfo);
  const todayBirthdays = birthdayInfos.filter(b => b.isToday);
  const next7DaysBirthdays = birthdayInfos
    .filter(b => b.isWithin7Days)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

  const totalBoys = branchChildren.filter(c => c.gender === 'Male').length;
  const totalGirls = branchChildren.filter(c => c.gender === 'Female').length;

  // Global Cross-Branch Aggregates for Global Admin
  const globalTotalChildren = allChildren.length;
  const globalWeekBirthdays = allChildren.map(getBirthdayInfo).filter(b => b.isWithin7Days);
  const branchBreakdown = CHURCH_BRANCHES.map(b => ({
    branch: b,
    count: allChildren.filter(c => c.branch === b).length,
    todayBirthdays: allChildren.filter(c => c.branch === b).map(getBirthdayInfo).filter(x => x.isToday).length
  }));

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Branch Welcome Header Banner */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-medium backdrop-blur-xs mb-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Branch: <strong>{activeBranch}</strong></span>
              {isGlobalAdmin && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 ml-1">
                  🌐 Global Admin
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Junior Church Records Portal
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl">
              Welcome back, {currentUser?.fullName}. Manage children records, monitor attendance rosters, and celebrate upcoming birthdays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-1.5"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Take Attendance</span>
            </button>
            {isAdmin && (
              <button
                onClick={onOpenAddChild}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Child</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GLOBAL ADMIN MULTI-BRANCH EXECUTIVE OVERVIEW */}
      {isGlobalAdmin && (
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-md space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Global Church Multi-Branch Oversight
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    🌐 Global Jurisdiction
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Consolidated metrics and 1-click branch switching across all {CHURCH_BRANCHES.length} church branches.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-semibold">
              <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">All-Branches Total: </span>
                <span className="text-slate-900 font-bold">{globalTotalChildren} Children</span>
              </div>
              <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span>Week Birthdays: </span>
                <span className="font-bold">{globalWeekBirthdays.length} Celebrants</span>
              </div>
            </div>
          </div>

          {/* 3 Branches Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {branchBreakdown.map(item => {
              const isCurrent = item.branch === activeBranch;
              return (
                <div
                  key={item.branch}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <Building2 className={`w-4 h-4 ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs text-slate-900">{item.branch}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                      <span>{item.count} Registered</span>
                      {item.todayBirthdays > 0 && (
                        <span className="text-amber-600 font-bold">• {item.todayBirthdays} Birthday Today!</span>
                      )}
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-600 text-white">
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveBranch(item.branch)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                    >
                      Switch →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Birthday Celebration Banner if Today has Birthdays */}
      {todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-2xl p-5 text-amber-950 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-xs flex items-center justify-center text-amber-700 shrink-0">
              <PartyPopper className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-amber-950">
                  🎉 Birthday Celebration Today!
                </span>
                <span className="bg-amber-900 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {todayBirthdays.length} {todayBirthdays.length === 1 ? 'Celebrant' : 'Celebrants'}
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                {todayBirthdays.map(b => `${b.child.fullName} (${b.ageCurrent} yrs old)`).join(' • ')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={triggerConfetti}
              className="px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Throw Confetti</span>
            </button>
            <button
              onClick={() => onNavigate('birthdays')}
              className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              View Celebrations
            </button>
          </div>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Registered Children */}
        <div
          onClick={() => onNavigate('children')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Children</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{branchChildren.length}</span>
            <span className="text-xs text-slate-400">in {activeBranch}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center space-x-2">
            <span>{totalBoys} Boys</span>
            <span>•</span>
            <span>{totalGirls} Girls</span>
          </div>
        </div>

        {/* Today's Birthdays */}
        <div
          onClick={() => onNavigate('birthdays')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Birthdays</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600">{todayBirthdays.length}</span>
            <span className="text-xs text-slate-500">
              {todayBirthdays.length === 1 ? 'child celebrating' : 'children celebrating'}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-amber-700 flex items-center space-x-1">
            <span>View birthday card & roster</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Upcoming in 7 Days */}
        <div
          onClick={() => onNavigate('birthdays')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next 7 Days</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{next7DaysBirthdays.length}</span>
            <span className="text-xs text-slate-500">upcoming birthdays</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {next7DaysBirthdays.length > 0 ? 'Reminders ready for teachers' : 'No upcoming birthdays this week'}
          </div>
        </div>

        {/* Attendance Records */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Logs</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{attendanceRecords.length}</span>
            <span className="text-xs text-slate-500">services logged</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center space-x-1">
            <span>Roster & history log</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* Main Two-Column Section: 7-Day Birthday Reminders & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 7-Day Birthday Spotlight */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Birthday Reminders (Next 7 Days)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Children in {activeBranch} celebrating this week
              </p>
            </div>
            <button
              onClick={() => onNavigate('birthdays')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {next7DaysBirthdays.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Cake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No birthdays in the next 7 days for {activeBranch}</p>
              <p className="text-[11px] text-slate-400 mt-1">Check the full birthday calendar to see celebrations later this month.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {next7DaysBirthdays.map(b => (
                <div
                  key={b.child.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    b.isToday
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        b.isToday
                          ? 'bg-amber-500 text-white'
                          : b.daysUntilBirthday === 1
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                      }`}>
                        {b.isToday ? 'Today!' : b.daysUntilBirthday === 1 ? 'Tomorrow' : `In ${b.daysUntilBirthday} days`}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">{b.child.fullName}</h4>
                      <p className="text-xs text-slate-500">
                        {b.birthDateFormatted} • Turning <strong className="text-indigo-700">{b.ageNext} years old</strong>
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-extrabold text-indigo-700 shadow-2xs">
                      {b.ageNext}
                    </div>
                  </div>

                  {b.child.notes && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 truncate">
                      💡 {b.child.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Navigation Grid */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onNavigate('children')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors"
              >
                <Users2 className="w-4 h-4 text-indigo-600 mb-1" />
                <div className="text-xs font-bold text-slate-800">Children Register</div>
                <div className="text-[10px] text-slate-500">Search & Profiles</div>
              </button>

              <button
                onClick={() => onNavigate('attendance')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors"
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <div className="text-xs font-bold text-slate-800">Attendance</div>
                <div className="text-[10px] text-slate-500">Take roll call</div>
              </button>

              <button
                onClick={() => onNavigate('birthdays')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors"
              >
                <Cake className="w-4 h-4 text-amber-600 mb-1" />
                <div className="text-xs font-bold text-slate-800">Birthdays</div>
                <div className="text-[10px] text-slate-500">Monthly schedule</div>
              </button>

              {isAdmin ? (
                <button
                  onClick={() => onNavigate('team')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-600 mb-1" />
                  <div className="text-xs font-bold text-slate-800">Team Mgmt</div>
                  <div className="text-[10px] text-slate-500">Max 2 Admins</div>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('account')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-600 mb-1" />
                  <div className="text-xs font-bold text-slate-800">My Profile</div>
                  <div className="text-[10px] text-slate-500">Account status</div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Portal Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Recent Activity</span>
              </h2>
              {isAdmin ? (
                <button
                  onClick={() => onNavigate('audit-trail')}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>Audit Trail</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Live Log</span>
              )}
            </div>

            <div className="space-y-3">
              {activityLogs.slice(0, 5).map(act => (
                <div key={act.id} className="flex space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 leading-tight">
                      {act.action}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {act.details}
                    </p>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-1">
                      <span>{act.userName}</span>
                      <span>•</span>
                      <span>{act.branch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice on Data Protection */}
          <div className="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Security & Child Privacy</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Regular teachers can view names, birth dates, and take attendance. Sensitive parent & guardian contact details are restricted exclusively to authorized administrators.
            </p>
          </div>
        </div>

      </div>

      {/* Floating Quick Actions Button & Speed-Dial for Teachers */}
      <QuickActionsFloatingButton
        onNavigate={onNavigate}
        onOpenAddChild={onOpenAddChild}
        onOpenImport={onOpenImport}
      />

    </div>
  );
};
