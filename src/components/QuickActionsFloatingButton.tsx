import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  ClipboardCheck,
  Search,
  Cake,
  UserPlus,
  FileSpreadsheet,
  X,
  Phone,
  Check,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService, formatDate, getBirthdayInfo } from '../services/storage';
import { Child, AttendanceStatus } from '../types';

interface QuickActionsFloatingButtonProps {
  onNavigate: (view: string) => void;
  onOpenAddChild?: () => void;
  onOpenImport?: () => void;
}

export const QuickActionsFloatingButton: React.FC<QuickActionsFloatingButtonProps> = ({
  onNavigate,
  onOpenAddChild,
  onOpenImport
}) => {
  const { activeBranch, isAdmin, currentUser } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [markSuccessToast, setMarkSuccessToast] = useState<string | null>(null);

  // Today's Date
  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Fetch children for current branch
  const branchChildren = useMemo(() => {
    return StorageService.getChildren().filter(c => c.branch === activeBranch);
  }, [activeBranch, markSuccessToast]);

  // Today's attendance record
  const todayRecord = useMemo(() => {
    const records = StorageService.getAttendance();
    return records.find(r => r.branch === activeBranch && r.date === todayStr);
  }, [activeBranch, todayStr, markSuccessToast]);

  // Filtered children for Quick Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return branchChildren.slice(0, 8); // show first 8 as default recent list
    }
    const q = searchQuery.toLowerCase().trim();
    return branchChildren.filter(c => {
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchGender = c.gender.toLowerCase() === q;
      const matchNotes = c.notes?.toLowerCase().includes(q);
      const matchAddress = c.homeAddress?.toLowerCase().includes(q);
      const matchPhone = c.guardians?.some(g => g.phone?.includes(q) || g.name.toLowerCase().includes(q));
      return matchName || matchGender || matchNotes || matchAddress || matchPhone;
    });
  }, [branchChildren, searchQuery]);

  // Quick 1-click mark present for today
  const handleQuickMarkPresent = (child: Child) => {
    const allRecords = StorageService.getAttendance();
    const existing = allRecords.find(r => r.branch === activeBranch && r.date === todayStr);

    let entries = existing ? [...existing.entries] : branchChildren.map(c => ({
      childId: c.id,
      childName: c.fullName,
      status: 'absent' as AttendanceStatus
    }));

    // Find and update this child's status
    const targetIdx = entries.findIndex(e => e.childId === child.id);
    if (targetIdx >= 0) {
      entries[targetIdx] = { ...entries[targetIdx], status: 'present' };
    } else {
      entries.push({
        childId: child.id,
        childName: child.fullName,
        status: 'present'
      });
    }

    StorageService.saveAttendanceRecord({
      date: todayStr,
      serviceTopic: 'Sunday Service',
      branch: activeBranch,
      recordedBy: {
        id: currentUser?.id || 'teacher',
        name: currentUser?.fullName || 'Teacher'
      },
      entries
    });

    setMarkSuccessToast(`✓ Marked ${child.fullName} present for today!`);
    setTimeout(() => setMarkSuccessToast(null), 3000);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Toast Feedback */}
      {markSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{markSuccessToast}</span>
        </div>
      )}

      {/* Floating Speed-Dial Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Container (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-3">
        
        {/* Speed-Dial Menu Options */}
        {isOpen && (
          <div className="flex flex-col items-end space-y-2.5 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
            
            {/* Action 1: Mark Attendance Today */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('attendance');
              }}
              className="flex items-center space-x-3 bg-white text-slate-800 hover:text-indigo-600 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/90 hover:border-indigo-300 transition-all transform hover:scale-105 group"
            >
              <span className="text-xs font-bold whitespace-nowrap">
                Mark Attendance Today
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition-colors">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </button>

            {/* Action 2: Quick Child Search */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSearchOpen(true);
              }}
              className="flex items-center space-x-3 bg-white text-slate-800 hover:text-emerald-600 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/90 hover:border-emerald-300 transition-all transform hover:scale-105 group"
            >
              <span className="text-xs font-bold whitespace-nowrap">
                Quick Child Search & Check-in
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 flex items-center justify-center transition-colors">
                <Search className="w-4 h-4" />
              </div>
            </button>

            {/* Action 3: Check Birthdays */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('birthdays');
              }}
              className="flex items-center space-x-3 bg-white text-slate-800 hover:text-amber-600 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/90 hover:border-amber-300 transition-all transform hover:scale-105 group"
            >
              <span className="text-xs font-bold whitespace-nowrap">
                Today's Birthday Celebrants
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-500 group-hover:text-white text-amber-600 flex items-center justify-center transition-colors">
                <Cake className="w-4 h-4" />
              </div>
            </button>

            {/* Action 4: Add New Child (Admin only) */}
            {isAdmin && onOpenAddChild && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddChild();
                }}
                className="flex items-center space-x-3 bg-white text-slate-800 hover:text-indigo-600 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/90 hover:border-indigo-300 transition-all transform hover:scale-105 group"
              >
                <span className="text-xs font-bold whitespace-nowrap">
                  Add New Child Record
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Action 5: Import Spreadsheet (Admin only) */}
            {isAdmin && onOpenImport && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenImport();
                }}
                className="flex items-center space-x-3 bg-white text-slate-800 hover:text-indigo-600 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/90 hover:border-indigo-300 transition-all transform hover:scale-105 group"
              >
                <span className="text-xs font-bold whitespace-nowrap">
                  Import Spreadsheet (6-Col)
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </button>
            )}

          </div>
        )}

        {/* The Main Floating Action Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          title="Quick Operational Actions for Teachers"
          className="relative inline-flex items-center space-x-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 text-white font-bold text-sm shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 ring-4 ring-white border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all select-none"
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5" />
              <span>Close Menu</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-indigo-700" />
              </div>
              <span className="tracking-wide">Quick Actions</span>
            </>
          )}
        </button>

      </div>

      {/* QUICK CHILD SEARCH MODAL OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            
            {/* Modal Header & Search Input */}
            <div className="p-5 border-b border-slate-100 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Quick Child Search & Check-in
                    </h3>
                    <p className="text-xs text-slate-500">
                      Active Branch: <strong>{activeBranch}</strong> ({branchChildren.length} registered children)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Large, High-Contrast Search Field */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type child's name, class, gender, or guardian phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No children found matching "{searchQuery}"</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try typing the first name, last name, age, or parent phone number for {activeBranch}.
                  </p>
                </div>
              ) : (
                searchResults.map(child => {
                  const bInfo = getBirthdayInfo(child);
                  // Check if marked present today
                  const isPresentToday = todayRecord?.entries.some(
                    e => e.childId === child.id && e.status === 'present'
                  );

                  return (
                    <div
                      key={child.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Child Details */}
                      <div className="flex items-start space-x-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                          child.gender === 'Female'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {child.fullName.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {child.fullName}
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Age {bInfo.ageCurrent}
                            </span>
                            {bInfo.isToday && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                                Birthday Today! 🎂
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-700">
                              {child.gender}
                            </span>
                            <span>•</span>
                            <span>Born {child.dateOfBirth}</span>
                            {child.homeAddress && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-xs">{child.homeAddress}</span>
                              </>
                            )}
                          </div>

                          {/* Family / Guardian Phone */}
                          {child.guardians && child.guardians.length > 0 && (
                            <div className="mt-1.5 flex items-center space-x-2 text-xs">
                              <span className="text-slate-500 text-[11px]">
                                {child.guardians[0].relationship || 'Guardian'}: {child.guardians[0].name}
                              </span>
                              {child.guardians[0].phone && (
                                <a
                                  href={`tel:${child.guardians[0].phone}`}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-mono text-[11px] font-semibold border border-emerald-200 transition-colors"
                                  title="Call guardian"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{child.guardians[0].phone}</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Check-in Actions */}
                      <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {isPresentToday ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Present Today</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickMarkPresent(child)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Mark Present</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsSearchOpen(false);
                            onNavigate('children');
                          }}
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
                          title="View in Full Register"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 rounded-b-3xl">
              <span>Showing {searchResults.length} {searchResults.length === 1 ? 'child' : 'children'}</span>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors"
              >
                Close Search
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
