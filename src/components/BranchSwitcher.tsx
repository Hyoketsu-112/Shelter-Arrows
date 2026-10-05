import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Building,
  Building2,
  ChevronDown,
  Check,
  Lock,
  ArrowLeftRight,
  ShieldCheck,
  Users,
  Info
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService } from '../services/storage';
import { CHURCH_BRANCHES, ChurchBranch } from '../types';

export const BranchSwitcher: React.FC = () => {
  const { currentUser, activeBranch, setActiveBranch, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine accessible branches for current user
  const accessibleBranches: ChurchBranch[] = currentUser
    ? (currentUser.role === 'admin'
        ? CHURCH_BRANCHES
        : currentUser.authorizedBranches && currentUser.authorizedBranches.length > 0
          ? currentUser.authorizedBranches
          : [currentUser.primaryBranch])
    : CHURCH_BRANCHES;

  const canSwitchBranches = accessibleBranches.length > 1;

  // Calculate live children count per branch
  const allChildren = StorageService.getChildren();
  const branchCounts: Record<ChurchBranch, number> = {
    'Shelter Okota': allChildren.filter(c => c.branch === 'Shelter Okota').length,
    'Community Church': allChildren.filter(c => c.branch === 'Community Church').length,
    'Anthony Church': allChildren.filter(c => c.branch === 'Anthony Church').length
  };

  const handleSelectBranch = (branch: ChurchBranch) => {
    if (!accessibleBranches.includes(branch)) return;

    setActiveBranch(branch);
    setIsOpen(false);

    // Provide immediate feedback notification
    setSwitchFeedback(`Switched to ${branch}`);
    setTimeout(() => setSwitchFeedback(null), 3000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Toast Notification upon branch change */}
      {switchFeedback && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-slate-900 text-white text-[11px] font-semibold py-1 px-3 rounded-full shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-1 flex items-center space-x-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{switchFeedback}</span>
        </div>
      )}

      {/* Main Trigger Button */}
      {canSwitchBranches ? (
        /* Multi-Branch Authorized Switcher Button */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all shadow-xs ${
            isOpen
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 text-indigo-900'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
          title="Toggle between authorized church branches"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5" />
          </div>

          <div className="text-left flex flex-col justify-center">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden lg:inline">
                Branch:
              </span>
              <span className="font-bold text-slate-900 leading-tight">
                {activeBranch}
              </span>
            </div>
          </div>

          {/* Authorized branches count badge */}
          <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ArrowLeftRight className="w-2.5 h-2.5" />
            <span>{accessibleBranches.length} Branches</span>
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>
      ) : (
        /* Single Branch Assigned Indicator (Non-switchable with permission status) */
        <div
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-2xs group relative cursor-default"
          title="You are assigned to this branch"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>

          <div className="text-left">
            <span className="font-bold text-slate-800 leading-tight">
              {activeBranch}
            </span>
          </div>

          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-600 flex items-center space-x-0.5">
            <Lock className="w-2.5 h-2.5 text-slate-500" />
            <span className="hidden sm:inline">Assigned</span>
          </span>

          {/* Hover tooltip for single branch users */}
          <div className="absolute top-10 left-0 hidden group-hover:block z-50 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl pointer-events-none leading-relaxed">
            <div className="font-bold flex items-center space-x-1 text-amber-300 mb-0.5">
              <Info className="w-3 h-3 shrink-0" />
              <span>Single Branch Assignment</span>
            </div>
            You currently have permissions for <strong>{activeBranch}</strong> only. Contact an administrator to request access to additional branches.
          </div>
        </div>
      )}

      {/* Dropdown Menu when toggled */}
      {isOpen && canSwitchBranches && (
        <div className="absolute right-0 sm:left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Switch Church Branch</p>
              <p className="text-[10px] text-slate-500">
                You have permission for {accessibleBranches.length} of {CHURCH_BRANCHES.length} branches
              </p>
            </div>
            {isAdmin && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Admin (All)
              </span>
            )}
          </div>

          {/* Branches List */}
          <div className="p-1 space-y-1">
            {CHURCH_BRANCHES.map(branch => {
              const isAccessible = accessibleBranches.includes(branch);
              const isCurrent = branch === activeBranch;
              const childCount = branchCounts[branch] || 0;

              return (
                <button
                  key={branch}
                  type="button"
                  disabled={!isAccessible}
                  onClick={() => handleSelectBranch(branch)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                      : isAccessible
                        ? 'hover:bg-slate-50 text-slate-700 font-medium'
                        : 'opacity-50 cursor-not-allowed bg-slate-50/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : isAccessible
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-slate-200 text-slate-400'
                    }`}>
                      {isAccessible ? (
                        <Building className="w-4 h-4" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="truncate">{branch}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-200 text-indigo-900">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal flex items-center space-x-1 mt-0.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{childCount} {childCount === 1 ? 'Child' : 'Children'} registered</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : isAccessible ? (
                      <span className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 group-hover:underline">
                        Switch
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                        Restricted
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Info Footer */}
          <div className="mt-1 pt-2 px-3 pb-1 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Branch data is isolated</span>
            <span className="text-indigo-600 font-medium">Automatic sync</span>
          </div>

        </div>
      )}

    </div>
  );
};
