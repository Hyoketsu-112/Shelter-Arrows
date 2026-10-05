import { Child, ChurchBranch } from '../types';
import { getBirthdayInfo } from './storage';

export interface NotificationSettings {
  desktopPushEnabled: boolean;
  inAppAlertsEnabled: boolean;
  soundAlertsEnabled: boolean;
}

const SETTINGS_KEY = 'shelter_jc_notification_settings_v1';
const ALERT_CACHE_KEY = 'shelter_jc_birthday_alert_history_v1';

const DEFAULT_SETTINGS: NotificationSettings = {
  desktopPushEnabled: true,
  inAppAlertsEnabled: true,
  soundAlertsEnabled: true
};

export const NotificationService = {
  getSettings(): NotificationSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<NotificationSettings>): NotificationSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },

  getBrowserPermission(): NotificationPermission {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  },

  async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },

  hasAlertedToday(childId: string): boolean {
    const today = this.getTodayKey();
    const raw = localStorage.getItem(ALERT_CACHE_KEY);
    if (!raw) return false;
    try {
      const cache: Record<string, string[]> = JSON.parse(raw);
      return Array.isArray(cache[today]) && cache[today].includes(childId);
    } catch {
      return false;
    }
  },

  markAlertedToday(childId: string): void {
    const today = this.getTodayKey();
    const raw = localStorage.getItem(ALERT_CACHE_KEY);
    let cache: Record<string, string[]> = {};
    if (raw) {
      try {
        cache = JSON.parse(raw);
      } catch {
        cache = {};
      }
    }
    if (!cache[today]) {
      cache[today] = [];
    }
    if (!cache[today].includes(childId)) {
      cache[today].push(childId);
    }
    // Clean up old dates to prevent storage growth
    const keys = Object.keys(cache);
    if (keys.length > 14) {
      keys.sort().slice(0, keys.length - 14).forEach(k => delete cache[k]);
    }
    localStorage.setItem(ALERT_CACHE_KEY, JSON.stringify(cache));
  },

  // Synthesize a gentle celebratory church chime using Web Audio API
  playBirthdayChime(): void {
    const settings = this.getSettings();
    if (!settings.soundAlertsEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.5);
      });
    } catch {
      // AudioContext might be blocked until user gesture, ignore safely
    }
  },

  // Send desktop browser push notification
  sendDesktopPush(child: Child, age: number): boolean {
    const settings = this.getSettings();
    if (!settings.desktopPushEnabled) return false;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;

    try {
      const n = new Notification(`🎂 Birthday Alert: ${child.fullName}!`, {
        body: `${child.fullName} is celebrating their ${age}th birthday today at ${child.branch}! Open portal to send church greetings.`,
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        tag: `birthday-${child.id}-${this.getTodayKey()}`,
        requireInteraction: false
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };

      return true;
    } catch (e) {
      console.error('Desktop push failed', e);
      return false;
    }
  },

  // Check children for today's celebrants that have not yet been alerted
  checkAndGetUnannouncedBirthdays(children: Child[]): { child: Child; age: number }[] {
    const unannounced: { child: Child; age: number }[] = [];

    for (const child of children) {
      const info = getBirthdayInfo(child);
      if (info.isToday) {
        if (!this.hasAlertedToday(child.id)) {
          unannounced.push({ child, age: info.ageCurrent });
        }
      }
    }

    return unannounced;
  }
};
