import React from 'react';
import {
  LayoutDashboard,
  Users2,
  Cake,
  ClipboardCheck,
  ShieldCheck,
  UserCircle,
  FileSpreadsheet,
  Mail,
  UserPlus,
  History,
  ScrollText
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService, getBirthdayInfo } from '../services/storage';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAddChild?: () => void;
  onOpenImport?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  onOpenAddChild,
  onOpenImport
}) => {
  const { isAdmin, activeBranch, currentUser } = useAuth();

  // Calculate upcoming birthdays count in active branch
  const children = StorageService.getChildren().filter(c => c.branch === activeBranch);
  const upcomingCount = children.map(getBirthdayInfo).filter(b => b.isWithin7Days).length;

  // Calculate pending account requests count for admins
  const allUsers = StorageService.getUsers();
  const pendingRequestsCount = allUsers.filter(u => u.status === 'pending').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      adminOnly: false
    },
    {
      id: 'children',
      label: 'Children Register',
      icon: Users2,
      badge: children.length,
      badgeColor: 'bg-slate-100 text-slate-700',
      adminOnly: false
    },
    {
      id: 'birthdays',
      label: 'Birthdays',
      icon: Cake,
      badge: upcomingCount > 0 ? upcomingCount : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
      adminOnly: false
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: ClipboardCheck,
      badge: null,
      adminOnly: false
    },
    {
      id: 'team',
      label: 'Team Management',
      icon: ShieldCheck,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: 'bg-rose-100 text-rose-800 font-bold',
      adminOnly: true
    },
    {
      id: 'audit-trail',
      label: 'Audit Trail',
      icon: ScrollText,
      badge: null,
      adminOnly: true
    },
    {
      id: 'email-digest',
      label: 'Birthday Email Digest',
      icon: Mail,
      badge: 'Resend',
      badgeColor: 'bg-indigo-100 text-indigo-700 font-medium',
      adminOnly: true
    },
    {
      id: 'account',
      label: 'Account & Security',
      icon: UserCircle,
      badge: null,
      adminOnly: false
    }
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Desktop / Tablet Navigation Row */}
        <div className="flex items-center justify-between overflow-x-auto py-2.5 scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map(item => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white font-bold'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin Quick Action Buttons */}
          {isAdmin && (
            <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200">
              {onOpenAddChild && (
                <button
                  onClick={onOpenAddChild}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Child</span>
                </button>
              )}
              {onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Import Excel/CSV</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};
