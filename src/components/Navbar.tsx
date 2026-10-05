import React, { useState } from 'react';
import {
  Church,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  MapPin,
  ChevronDown,
  Sparkles,
  Users,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { ChurchLogo } from './ChurchLogo';
import { BranchSwitcher } from './BranchSwitcher';
import { useAuth } from '../services/authContext';
import { StorageService, getBirthdayInfo } from '../services/storage';
import { CHURCH_BRANCHES, ChurchBranch, User } from '../types';

interface NavbarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const { currentUser, activeBranch, logout, isAdmin, isGlobalAdmin, isApproved, login } = useAuth();
  const [showBirthdayMenu, setShowBirthdayMenu] = useState(false);

  // Calculate upcoming birthdays for current branch
  const allChildren = StorageService.getChildren().filter(c => c.branch === activeBranch);
  const birthdayInfos = allChildren.map(getBirthdayInfo);
  const birthdays7Days = birthdayInfos.filter(b => b.isWithin7Days).sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  const todayBirthdays = birthdayInfos.filter(b => b.isToday);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Brand */}
          <div className="cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <ChurchLogo size="md" />
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Top Navigation Bar Branch Switcher */}
            <BranchSwitcher />

            {/* Birthday Alert Notification Badge */}
            <div className="relative">
              <button
                onClick={() => setShowBirthdayMenu(!showBirthdayMenu)}
                className={`relative p-2 rounded-lg border transition-colors ${
                  todayBirthdays.length > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : birthdays7Days.length > 0
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Upcoming Birthdays in 7 Days"
              >
                <Bell className="w-4 h-4" />
                {birthdays7Days.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs">
                    {birthdays7Days.length}
                  </span>
                )}
              </button>

              {showBirthdayMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-40"
                  onMouseLeave={() => setShowBirthdayMenu(false)}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-800">Birthday Reminders (Next 7 Days)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {activeBranch}
                    </span>
                  </div>

                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {birthdays7Days.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        No upcoming birthdays in the next 7 days for {activeBranch}.
                      </p>
                    ) : (
                      birthdays7Days.map(b => (
                        <div
                          key={b.child.id}
                          onClick={() => {
                            setShowBirthdayMenu(false);
                            onNavigate('birthdays');
                          }}
                          className={`p-2 rounded-lg cursor-pointer transition-colors text-xs flex items-center justify-between ${
                            b.isToday
                              ? 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                              <span>{b.child.fullName}</span>
                              {b.isToday && (
                                <span className="bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.2 rounded-full uppercase">
                                  Today!
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {b.birthDateFormatted} • Turning <span className="font-medium text-slate-700">{b.ageNext} yrs</span>
                            </p>
                          </div>
                          <span className={`text-[11px] font-semibold ${b.isToday ? 'text-amber-600' : 'text-indigo-600'}`}>
                            {b.isToday ? '🎉 Celebrate' : `In ${b.daysUntilBirthday}d`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowBirthdayMenu(false);
                        onNavigate('birthdays');
                      }}
                      className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-1"
                    >
                      View Calendar & Alert Settings →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Badge */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div
                  onClick={() => onNavigate('account')}
                  className="cursor-pointer flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isGlobalAdmin
                      ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                      : isAdmin
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.fullName.split(' ')[0]}
                    </p>
                    <div className="flex items-center space-x-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-sm ${
                        isGlobalAdmin
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                          : isAdmin
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isGlobalAdmin ? '🌐 Global Admin' : isAdmin ? 'Branch Admin' : currentUser.role === 'admin' ? 'Pending Admin' : 'Teacher'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </header>
  );
};
