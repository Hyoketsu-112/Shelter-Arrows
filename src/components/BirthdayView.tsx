import React, { useState } from 'react';
import {
  Cake,
  Calendar,
  Sparkles,
  PartyPopper,
  Gift,
  Clock,
  Printer,
  ChevronRight,
  Filter,
  Users,
  Heart,
  Bell,
  BellRing,
  Check,
  Info,
  ShieldCheck,
  ArrowRight,
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../services/authContext';
import { StorageService, getBirthdayInfo } from '../services/storage';
import { BirthdayInfo, Child } from '../types';
import { NotificationSettingsModal } from './NotificationSettingsModal';

export const BirthdayView: React.FC = () => {
  const { activeBranch } = useAuth();
  
  const allChildren = StorageService.getChildren().filter(c => c.branch === activeBranch);
  const allBirthdayInfos = allChildren.map(getBirthdayInfo);

  // Today's birthdays
  const todayBirthdays = allBirthdayInfos.filter(b => b.isToday);

  // Next 7 days birthdays (sorted by days until birthday)
  const next7Days = allBirthdayInfos
    .filter(b => b.isWithin7Days && !b.isToday)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

  // Browser notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });
  const [testAlertToast, setTestAlertToast] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Month filter for full calendar
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter children by birth month
  const monthBirthdays = allChildren
    .filter(c => {
      const dob = new Date(c.dateOfBirth);
      return dob.getMonth() === selectedMonth;
    })
    .map(getBirthdayInfo)
    .sort((a, b) => {
      const dayA = new Date(a.child.dateOfBirth).getDate();
      const dayB = new Date(b.child.dateOfBirth).getDate();
      return dayA - dayB;
    });

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const requestBrowserNotifications = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in this browser environment.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('🎉 Birthday Alerts Enabled!', {
          body: `You will receive alerts for upcoming birthdays in ${activeBranch}.`,
          icon: '/logo.jpg'
        });
        setTestAlertToast('Browser notifications enabled successfully!');
        setTimeout(() => setTestAlertToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestBirthdayAlert = () => {
    triggerCelebration();

    const celebrant = todayBirthdays[0]?.child || next7Days[0]?.child || allChildren[0];
    const name = celebrant ? celebrant.fullName : 'Emmanuel David';
    const age = todayBirthdays[0]?.ageCurrent || next7Days[0]?.ageNext || 8;

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`🎂 Birthday Alert: ${name}!`, {
          body: `${name} is celebrating their ${age}th birthday in ${activeBranch}! Don't forget to celebrate and pray with them.`,
          icon: '/logo.jpg'
        });
      } catch (e) {
        console.error(e);
      }
    }

    setTestAlertToast(`🎉 BIRTHDAY ALERT: ${name} is turning ${age} years old in ${activeBranch}! Scheduled announcement active.`);
    setTimeout(() => setTestAlertToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Birthday Celebrations & Reminders
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {activeBranch}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor upcoming birthdays, calculate next ages, and prepare weekly church announcements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={triggerCelebration}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Celebrate Confetti</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Print Roster</span>
          </button>
        </div>
      </div>

      {/* Test Alert Toast */}
      {testAlertToast && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs shadow-md flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <PartyPopper className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-bold">{testAlertToast}</span>
          </div>
          <button
            onClick={() => setTestAlertToast(null)}
            className="text-amber-800 hover:text-amber-950 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Birthday Alert Notification Center Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                🔔
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                How Church Birthday Alerts Work
              </h3>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Automated 0–7 Days
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              The system monitors children in <strong>{activeBranch}</strong> and automatically triggers alerts through 4 built-in channels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {typeof Notification !== 'undefined' && notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={requestBrowserNotifications}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                <span>Enable Browser Alerts</span>
              </button>
            )}

            {notificationPermission === 'granted' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Browser Alerts Active</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleTestBirthdayAlert}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Birthday Alert Now</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Configure Desktop & In-App Notifications"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* 4 Alert Channels Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 mb-1">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Top Bar Bell Counter</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              A glowing amber notification badge in the top navigation bar displays the exact count of birthdays coming up within 7 days.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 mb-1">
              <PartyPopper className="w-3.5 h-3.5 text-indigo-500" />
              <span>2. Dashboard Alert Banner</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every Sunday or service day, celebrants are pinned right to the top of your dashboard as soon as you log in.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 mb-1">
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Desktop & Phone Popups</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Device-level notifications pop up when children celebrate their birthdays today or in the current week.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 mb-1">
              <Cake className="w-3.5 h-3.5 text-rose-500" />
              <span>4. Weekly Announcements</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Printable roster or email digest with child names and turning ages ready for Sunday pulpit announcements.
            </p>
          </div>
        </div>
      </div>

      {/* TODAY'S BIRTHDAYS HERO */}
      {todayBirthdays.length > 0 ? (
        <div className="bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-6 sm:p-8 text-amber-950 shadow-xl relative overflow-hidden border border-amber-300">
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/70 text-amber-900 font-bold text-xs uppercase tracking-wider mb-3">
              <PartyPopper className="w-4 h-4 text-amber-700 animate-bounce" />
              <span>Today's Church Celebrants</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-950">
              Happy Birthday to our Junior Church Stars! 🎂
            </h2>
            <p className="text-xs sm:text-sm text-amber-900/90 font-medium mt-1 max-w-xl">
              May the Lord bless and keep them shining bright in faith, wisdom, and health.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayBirthdays.map(b => (
                <div
                  key={b.child.id}
                  className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 shadow-md border border-amber-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-extrabold text-lg flex items-center justify-center shadow-inner">
                      {b.child.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {b.child.fullName}
                      </h3>
                      <p className="text-xs text-amber-800 font-semibold mt-0.5">
                        Turning {b.ageCurrent} Years Old Today!
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Born {b.child.dateOfBirth}
                      </span>
                    </div>
                  </div>
                  <Gift className="w-6 h-6 text-amber-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2">
            <Cake className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No birthdays scheduled for today</h3>
          <p className="text-xs text-slate-500 mt-1">
            Check the 7-day upcoming list below for birthdays occurring later this week in {activeBranch}.
          </p>
        </div>
      )}

      {/* UPCOMING IN THE NEXT 7 DAYS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Upcoming Birthdays (Next 7 Days)
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {next7Days.length} {next7Days.length === 1 ? 'Celebrant' : 'Celebrants'}
          </span>
        </div>

        {next7Days.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">
              No birthdays in the next 7 days for {activeBranch}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {next7Days.map(b => (
              <div
                key={b.child.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                      {b.daysUntilBirthday === 1 ? 'Tomorrow' : `In ${b.daysUntilBirthday} days`}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {b.birthDateFormatted}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">
                    {b.child.fullName}
                  </h3>
                  
                  <div className="mt-1 text-xs text-slate-600">
                    Will turn <strong className="text-indigo-700 font-extrabold">{b.ageNext} years old</strong>
                  </div>
                </div>

                {b.child.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500 truncate">
                    Notes: {b.child.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MONTHLY BIRTHDAY ROSTER & CALENDAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Monthly Birthday Calendar ({months[selectedMonth]})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All celebrations registered for {months[selectedMonth]} across {activeBranch}
            </p>
          </div>

          {/* Month selector dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Month:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly table */}
        {monthBirthdays.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">
              No birthdays recorded in {months[selectedMonth]} for {activeBranch}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Child Name</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Next Age</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthBirthdays.map(b => (
                  <tr key={b.child.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                      {b.birthDateFormatted}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {b.child.fullName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        b.child.gender === 'Female' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {b.child.gender}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-700">
                      Turning {b.ageNext} yrs
                    </td>
                    <td className="py-2.5 px-3">
                      {b.isToday ? (
                        <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase">
                          Today!
                        </span>
                      ) : b.daysUntilBirthday >= 0 && b.daysUntilBirthday <= 7 ? (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                          In {b.daysUntilBirthday}d
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Upcoming</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Notification Settings Modal */}
      {isSettingsOpen && (
        <NotificationSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

    </div>
  );
};
