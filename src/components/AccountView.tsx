import React, { useState } from 'react';
import {
  UserCircle,
  KeyRound,
  Shield,
  Building,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BellRing,
  Laptop,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService } from '../services/storage';
import { NotificationService, NotificationSettings } from '../services/notificationService';

export const AccountView: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Notification Settings
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => NotificationService.getSettings());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => NotificationService.getBrowserPermission());
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const handleToggleDesktopNotifications = async () => {
    if (!notifSettings.desktopPushEnabled) {
      if (notifPermission !== 'granted') {
        const res = await NotificationService.requestBrowserPermission();
        setNotifPermission(res);
        if (res !== 'granted') {
          setNotifFeedback('Browser notifications permission was not granted.');
          setTimeout(() => setNotifFeedback(null), 4000);
          return;
        }
      }
      const updated = NotificationService.saveSettings({ desktopPushEnabled: true });
      setNotifSettings(updated);
      setNotifFeedback('Desktop browser notifications enabled!');
      setTimeout(() => setNotifFeedback(null), 3000);
    } else {
      const updated = NotificationService.saveSettings({ desktopPushEnabled: false });
      setNotifSettings(updated);
      setNotifFeedback('Desktop browser notifications disabled.');
      setTimeout(() => setNotifFeedback(null), 3000);
    }
  };

  const handleToggleInAppAlerts = () => {
    const updated = NotificationService.saveSettings({ inAppAlertsEnabled: !notifSettings.inAppAlertsEnabled });
    setNotifSettings(updated);
  };

  const handleToggleSound = () => {
    const nextVal = !notifSettings.soundAlertsEnabled;
    const updated = NotificationService.saveSettings({ soundAlertsEnabled: nextVal });
    setNotifSettings(updated);
    if (nextVal) {
      NotificationService.playBirthdayChime();
    }
  };

  const handleSendTestPush = () => {
    NotificationService.playBirthdayChime();
    if (notifSettings.desktopPushEnabled && notifPermission === 'granted') {
      try {
        new Notification('🎉 Birthday Alert Test - The Shelter', {
          body: 'Test push notification successful! You will receive alerts when children celebrate birthdays today.',
          icon: '/logo.jpg'
        });
        setNotifFeedback('Test notification sent to your desktop!');
      } catch {
        setNotifFeedback('Could not send notification. Check browser settings.');
      }
    } else {
      setNotifFeedback('Chime tested! Enable Desktop Notifications to receive browser popups.');
    }
    setTimeout(() => setNotifFeedback(null), 4000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password should be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSuccess('Your password has been successfully updated.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Staff Account & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your church staff profile, change password, and check branch authorizations.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card (Left 1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 to-amber-500 text-white font-extrabold text-2xl flex items-center justify-center mb-4 shadow-md">
              {currentUser?.fullName.charAt(0)}
            </div>

            <h3 className="font-bold text-base text-slate-900">{currentUser?.fullName}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser?.email}</p>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Access Role:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                  isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {currentUser?.role}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Primary Branch:</span>
                <span className="font-semibold text-slate-800">{currentUser?.primaryBranch}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Authorized Branches:</span>
                <div className="flex flex-wrap gap-1">
                  {currentUser?.authorizedBranches.map(b => (
                    <span key={b} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Status:</span>
                <span className="font-semibold text-emerald-700 capitalize flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{currentUser?.status}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={logout}
              className="w-full py-2 px-3 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>

        {/* Change Password Form (Right 2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update your account credentials to keep church records secure.
            </p>

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Birthday Alerts & Browser Notification Preferences Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <BellRing className="w-4 h-4 text-indigo-600" />
                  <span>Automated Birthday Alerts & Notifications</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure alerts sent when a child's birthday occurs that day.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendTestPush}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Alert</span>
              </button>
            </div>

            {notifFeedback && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{notifFeedback}</span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              
              {/* Toggle 1: Desktop Browser Notifications */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-start space-x-3 pr-2">
                  <Laptop className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-800">
                        Desktop Browser Push Notifications
                      </span>
                      {notifPermission === 'granted' ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : notifPermission === 'denied' ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                          Blocked in Browser
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                          Needs Permission
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sends an alert to your device on the day of a child's birthday even if the tab is inactive.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifSettings.desktopPushEnabled && notifPermission === 'granted'}
                  onClick={handleToggleDesktopNotifications}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    notifSettings.desktopPushEnabled && notifPermission === 'granted' ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifSettings.desktopPushEnabled && notifPermission === 'granted' ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: In-App Birthday Popups */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-start space-x-3 pr-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-slate-800">
                      In-App Celebrant Alert Modal
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Automatically shows a celebratory greeting banner with confetti when logging in on a child's birthday.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifSettings.inAppAlertsEnabled}
                  onClick={handleToggleInAppAlerts}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    notifSettings.inAppAlertsEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifSettings.inAppAlertsEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Sound Chimes */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-start space-x-3 pr-2">
                  {notifSettings.soundAlertsEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-xs text-slate-800">
                      Celebratory Audio Chime
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Plays a pleasant melodic chime when a birthday alert is delivered.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifSettings.soundAlertsEnabled}
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    notifSettings.soundAlertsEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifSettings.soundAlertsEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
