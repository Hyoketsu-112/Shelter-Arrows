import React, { useEffect } from 'react';
import {
  PartyPopper,
  Gift,
  X,
  Phone,
  Mail,
  User as UserIcon,
  Cake,
  Settings,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Child } from '../types';
import { NotificationService } from '../services/notificationService';

interface BirthdayAlertModalProps {
  celebrants: { child: Child; age: number }[];
  onDismiss: () => void;
  onNavigateToChild?: (childId: string) => void;
  onOpenSettings?: () => void;
}

export const BirthdayAlertModal: React.FC<BirthdayAlertModalProps> = ({
  celebrants,
  onDismiss,
  onNavigateToChild,
  onOpenSettings
}) => {
  if (!celebrants || celebrants.length === 0) return null;

  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });

    // Play optional gentle chime
    NotificationService.playBirthdayChime();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-300 animate-in fade-in zoom-in-95">
        
        {/* Celebratory Banner Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-6 text-amber-950 relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/90 text-amber-800 flex items-center justify-center text-2xl shadow-md">
                🎂
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-900 text-amber-100 px-2 py-0.5 rounded-full">
                  Today's Birthday Alert
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-amber-950 mt-1 leading-tight">
                  Happy Birthday Celebrant!
                </h2>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="p-1 rounded-xl bg-white/40 hover:bg-white/70 text-amber-950 transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-amber-900/90 font-medium mt-2">
            The church joins in thanking God for another blessed year of life, health, and spiritual growth!
          </p>
        </div>

        {/* Celebrants Cards List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {celebrants.map(({ child, age }) => (
            <div
              key={child.id}
              className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-white font-black text-base flex items-center justify-center shadow-xs">
                    {child.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {child.fullName}
                    </h3>
                    <p className="text-xs font-bold text-amber-800">
                      Turning {age} Years Old Today! 🎉
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-amber-200 text-slate-700">
                  {child.branch}
                </span >
              </div>

              {/* Notes / Special Info */}
              {child.notes && (
                <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-amber-100/80 italic">
                  "{child.notes}"
                </p>
              )}

              {/* Guardian Contact (Quick phone call/greeting) */}
              {child.guardians && child.guardians.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 text-xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Family Contact:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {child.guardians[0].name} ({child.guardians[0].relationship})
                    </span>
                    {child.guardians[0].phone && (
                      <a
                        href={`tel:${child.guardians[0].phone}`}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-mono text-[11px] border border-emerald-200"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{child.guardians[0].phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {onNavigateToChild && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToChild(child.id);
                    onDismiss();
                  }}
                  className="w-full mt-2 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>View Child in Register</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-slate-500 hover:text-slate-800 flex items-center space-x-1.5 font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Alert Settings</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
