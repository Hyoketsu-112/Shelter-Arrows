import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  ShieldCheck,
  Info
} from 'lucide-react';
import { NotificationService, NotificationSettings } from '../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(() => NotificationService.getSettings());
  const [permission, setPermission] = useState<NotificationPermission>(() => NotificationService.getBrowserPermission());
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleDesktop = async () => {
    if (!settings.desktopPushEnabled) {
      // User is turning it ON
      if (permission !== 'granted') {
        const newPerm = await NotificationService.requestBrowserPermission();
        setPermission(newPerm);
        if (newPerm !== 'granted') {
          setFeedback('Browser notifications were not granted. Please check your browser site permissions.');
          setTimeout(() => setFeedback(null), 5000);
          return;
        }
      }
      const updated = NotificationService.saveSettings({ desktopPushEnabled: true });
      setSettings(updated);
      setFeedback('Desktop browser notifications enabled!');
      setTimeout(() => setFeedback(null), 3500);
      onSettingsChanged?.();
    } else {
      // User is turning it OFF
      const updated = NotificationService.saveSettings({ desktopPushEnabled: false });
      setSettings(updated);
      setFeedback('Desktop browser notifications disabled.');
      setTimeout(() => setFeedback(null), 3500);
      onSettingsChanged?.();
    }
  };

  const handleToggleInApp = () => {
    const updated = NotificationService.saveSettings({
      inAppAlertsEnabled: !settings.inAppAlertsEnabled
    });
    setSettings(updated);
    onSettingsChanged?.();
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundAlertsEnabled;
    const updated = NotificationService.saveSettings({
      soundAlertsEnabled: nextVal
    });
    setSettings(updated);
    if (nextVal) {
      NotificationService.playBirthdayChime();
    }
    onSettingsChanged?.();
  };

  const handleTestAlert = async () => {
    NotificationService.playBirthdayChime();

    if (settings.desktopPushEnabled && permission === 'granted') {
      try {
        new Notification('🎉 Birthday Alert Test - The Shelter', {
          body: 'This is a test birthday push alert. You will be automatically notified when children celebrate birthdays today!',
          icon: '/logo.jpg'
        });
        setFeedback('Test push notification sent to your desktop!');
      } catch {
        setFeedback('Unable to trigger desktop notification. Check your browser permissions.');
      }
    } else {
      setFeedback('In-app chime tested! Enable Desktop Notifications above to receive browser popups.');
    }

    setTimeout(() => setFeedback(null), 4000);
  };

  const isBrowserSupported = typeof Notification !== 'undefined';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Birthday Alert & Notification Settings
              </h3>
              <p className="text-xs text-slate-500">
                Automated alerts when children celebrate birthdays that day
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Settings Toggles List */}
        <div className="mt-5 space-y-4">
          
          {/* Toggle 1: Desktop Browser Push Notifications */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5 shadow-2xs">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Desktop Browser Notifications
                    </span>
                    {permission === 'granted' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        Granted
                      </span>
                    ) : permission === 'denied' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800">
                        Needs Permission
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Receive native operating system & browser push banners on the day of a child's birthday, even if the tab is in the background.
                  </p>
                </div>
              </div>

              {/* Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.desktopPushEnabled}
                onClick={handleToggleDesktop}
                disabled={!isBrowserSupported}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.desktopPushEnabled && permission === 'granted' ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.desktopPushEnabled && permission === 'granted' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {permission === 'denied' && (
              <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Notifications are blocked in your browser. Click the lock/tune icon near your browser address bar to allow notifications for this site.
                </span>
              </div>
            )}
          </div>

          {/* Toggle 2: In-App Celebratory Popups */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    In-App Birthday Celebrant Popups
                  </span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Automatically display a celebration banner with confetti when logging in or opening the app on a child's birthday.
                  </p>
                </div>
              </div>

              {/* Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.inAppAlertsEnabled}
                onClick={handleToggleInApp}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.inAppAlertsEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.inAppAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Toggle 3: Sound Chime */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5 shadow-2xs">
                  {settings.soundAlertsEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    Celebration Audio Chime
                  </span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Play a gentle melodic church chime when a birthday alert is displayed.
                  </p>
                </div>
              </div>

              {/* Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundAlertsEnabled}
                onClick={handleToggleSound}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.soundAlertsEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.soundAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestAlert}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Send Test Push & Chime</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
