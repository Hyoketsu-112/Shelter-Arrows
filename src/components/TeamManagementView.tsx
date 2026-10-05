import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Clock,
  ShieldAlert,
  Edit3,
  Check,
  X,
  Lock,
  Trash2,
  Crown
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService } from '../services/storage';
import { User, ChurchBranch, UserRole, AccountStatus, CHURCH_BRANCHES } from '../types';

export const TeamManagementView: React.FC = () => {
  const { currentUser, isGlobalAdmin } = useAuth();
  
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [tab, setTab] = useState<'staff' | 'pending'>('staff');
  const [selectedUserForBranch, setSelectedUserForBranch] = useState<User | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const adminCount = StorageService.getAdminCount();
  const globalAdminCount = StorageService.getGlobalAdminCount();
  const isAdminLimitReached = adminCount >= 2;

  const refreshUsers = () => {
    setUsers(StorageService.getUsers());
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Approve Request
  const handleApprove = (user: User, approvedRole?: UserRole) => {
    const roleToGrant = approvedRole || user.requestedRole;

    if (roleToGrant === 'admin') {
      const check = StorageService.canApproveAsAdmin(user.id, roleToGrant);
      if (!check.allowed) {
        showFeedback(check.reason || 'Maximum of 2 branch administrators reached across the system.', 'error');
        return;
      }
    }

    const all = StorageService.getUsers();
    const updated = all.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          status: 'approved' as AccountStatus,
          role: roleToGrant,
          authorizedBranches: roleToGrant === 'global_admin' ? CHURCH_BRANCHES : u.authorizedBranches,
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser?.id
        };
      }
      return u;
    });

    StorageService.saveUsers(updated);
    StorageService.logActivity({
      userName: currentUser?.fullName || 'Admin',
      userRole: currentUser?.role || 'admin',
      branch: user.primaryBranch,
      action: 'Staff Account Approved',
      details: `Approved ${user.fullName} as ${roleToGrant} for ${user.primaryBranch}`,
      type: 'team'
    });

    refreshUsers();
    showFeedback(`Approved ${user.fullName} as ${roleToGrant}.`);
  };

  // Reject Request
  const handleReject = (user: User) => {
    const all = StorageService.getUsers();
    const updated = all.map(u => {
      if (u.id === user.id) {
        return { ...u, status: 'rejected' as AccountStatus };
      }
      return u;
    });

    StorageService.saveUsers(updated);
    StorageService.logActivity({
      userName: currentUser?.fullName || 'Admin',
      userRole: 'admin',
      branch: user.primaryBranch,
      action: 'Staff Request Rejected',
      details: `Declined account request for ${user.fullName}`,
      type: 'team'
    });

    refreshUsers();
    showFeedback(`Declined account request for ${user.fullName}.`);
  };

  // Toggle Suspend / Active
  const handleToggleSuspend = (user: User) => {
    if (user.id === currentUser?.id) {
      showFeedback('You cannot suspend your own administrative account.', 'error');
      return;
    }

    const nextStatus: AccountStatus = user.status === 'suspended' ? 'approved' : 'suspended';
    const all = StorageService.getUsers();
    const updated = all.map(u => (u.id === user.id ? { ...u, status: nextStatus } : u));

    StorageService.saveUsers(updated);
    StorageService.logActivity({
      userName: currentUser?.fullName || 'Admin',
      userRole: 'admin',
      branch: user.primaryBranch,
      action: nextStatus === 'suspended' ? 'Staff Suspended' : 'Staff Reactivated',
      details: `${nextStatus === 'suspended' ? 'Suspended' : 'Reactivated'} account for ${user.fullName}`,
      type: 'team'
    });

    refreshUsers();
    showFeedback(`Staff status updated for ${user.fullName}.`);
  };

  // Change Role
  const handleChangeRole = (user: User, newRole: UserRole) => {
    if (newRole === 'admin') {
      const check = StorageService.canApproveAsAdmin(user.id, newRole);
      if (!check.allowed) {
        showFeedback(check.reason || 'Maximum of 2 branch administrators reached.', 'error');
        return;
      }
    }

    // Only Global Admins can grant or modify Global Admin role (unless there is no global admin or only 1 user)
    if (newRole === 'global_admin' && !isGlobalAdmin && globalAdminCount > 0 && users.length > 1) {
      showFeedback('Only an existing Global Administrator can appoint a Global Administrator.', 'error');
      return;
    }

    // Protect primary global admin from demotion by non-global admin
    if (user.role === 'global_admin' && newRole !== 'global_admin') {
      if (!isGlobalAdmin) {
        showFeedback('Only a Global Administrator can modify Global Admin roles.', 'error');
        return;
      }
      if (globalAdminCount <= 1) {
        showFeedback('The system must maintain at least 1 Global Administrator.', 'error');
        return;
      }
    }

    // If demoting a branch admin, ensure at least 1 admin or global admin remains
    if (user.role === 'admin' && newRole === 'teacher') {
      if (adminCount <= 1 && globalAdminCount === 0) {
        showFeedback('The system must maintain at least 1 active administrator.', 'error');
        return;
      }
    }

    const all = StorageService.getUsers();
    const updated = all.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          role: newRole,
          authorizedBranches: newRole === 'global_admin' ? CHURCH_BRANCHES : u.authorizedBranches
        };
      }
      return u;
    });
    StorageService.saveUsers(updated);

    StorageService.logActivity({
      userName: currentUser?.fullName || 'Admin',
      userRole: currentUser?.role || 'admin',
      branch: user.primaryBranch,
      action: 'Staff Role Changed',
      details: `Changed ${user.fullName} role to ${newRole}`,
      type: 'team'
    });

    refreshUsers();
    setSelectedUserForRole(null);
    showFeedback(`Role for ${user.fullName} updated to ${newRole}.`);
  };

  // Update Branch Access
  const handleSaveBranchAccess = (userId: string, branches: ChurchBranch[]) => {
    if (branches.length === 0) {
      showFeedback('Staff member must be assigned to at least one church branch.', 'error');
      return;
    }

    const all = StorageService.getUsers();
    const updated = all.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          authorizedBranches: branches,
          primaryBranch: branches.includes(u.primaryBranch) ? u.primaryBranch : branches[0]
        };
      }
      return u;
    });

    StorageService.saveUsers(updated);
    StorageService.logActivity({
      userName: currentUser?.fullName || 'Admin',
      userRole: 'admin',
      branch: branches[0],
      action: 'Branch Access Updated',
      details: `Updated branch permissions for user`,
      type: 'team'
    });

    refreshUsers();
    setSelectedUserForBranch(null);
    showFeedback('Branch access permissions saved successfully.');
  };

  // Permanently Remove Staff Member
  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = StorageService.deleteUser(
      userToDelete.id,
      currentUser?.id || '',
      currentUser?.fullName || 'Admin',
      'admin'
    );
    if (!res.success) {
      showFeedback(res.message, 'error');
    } else {
      showFeedback(res.message, 'success');
      refreshUsers();
    }
    setUserToDelete(null);
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeStaff = users.filter(u => u.status !== 'pending');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Team & Staff Management
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Admin Console
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Approve teacher requests, manage branch access, and enforce system security limits.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab('staff')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === 'staff'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Directory ({activeStaff.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              tab === 'pending'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Requests</span>
            {pendingUsers.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 shadow-xs ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* NO GLOBAL ADMIN OR SOLE USER BANNER */}
      {(globalAdminCount === 0 || users.length === 1) && (
        <div className="p-5 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-orange-50 text-amber-950 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-amber-950 flex items-center space-x-2">
                  <span>{users.length === 1 ? 'Sole User Setup' : 'Global Administrator Required'}</span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Executive Access</span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 max-w-2xl leading-relaxed">
                  {users.length === 1
                    ? `You currently have 1 user (${users[0].fullName}) in the church register. Make this user a Global Administrator to unlock consolidated oversight across Shelter Okota, Community Church, and Anthony Church.`
                    : 'The church register currently has no assigned Global Administrator. Any administrator can appoint a Global Admin to activate multi-branch governance.'}
                </p>
              </div>
            </div>

            {users.length === 1 && users[0].role !== 'global_admin' && (
              <button
                type="button"
                onClick={() => {
                  handleChangeRole(users[0], 'global_admin');
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center space-x-2 self-start sm:self-auto"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>Appoint {users[0].fullName} as Global Admin</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2-ADMINISTRATOR HARD QUOTA BANNER */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isAdminLimitReached
          ? 'bg-linear-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950'
          : 'bg-linear-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAdminLimitReached ? 'bg-amber-200 text-amber-900' : 'bg-indigo-200 text-indigo-900'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base">
                  System Administrator Quota Policy
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isAdminLimitReached
                    ? 'bg-amber-500 text-white'
                    : 'bg-indigo-600 text-white'
                }`}>
                  {adminCount} / 2 Slots Utilized
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90 max-w-2xl leading-relaxed">
                As required by church governance, the entire system is strictly capped at a <strong>maximum of 2 administrators</strong> across all church branches.
                {isAdminLimitReached
                  ? ' Both administrative slots are currently occupied. To approve an additional admin or grant admin privileges, an existing administrator must first be reassigned as a Teacher.'
                  : ' 1 administrative slot is currently available.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center space-x-2 bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-black/5 text-xs font-mono font-bold">
            <span>Quota Status:</span>
            <span className={isAdminLimitReached ? 'text-amber-700' : 'text-emerald-700'}>
              {isAdminLimitReached ? 'LIMIT REACHED (2/2)' : `${adminCount}/2 AVAILABLE`}
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: ACTIVE STAFF DIRECTORY */}
      {tab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Approved Church Staff Directory</h3>
            <span className="text-xs text-slate-400 font-medium">
              Total {activeStaff.length} active members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Primary Branch</th>
                  <th className="py-3 px-4">Authorized Branches</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeStaff.map(staff => {
                  const isCurrent = staff.id === currentUser?.id;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            staff.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {staff.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{staff.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-sm">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {staff.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          staff.role === 'global_admin'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : staff.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {staff.role === 'global_admin' ? '🌐 Global Admin' : staff.role === 'admin' ? 'Branch Admin' : 'Teacher'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        {staff.primaryBranch}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {staff.authorizedBranches.map(b => (
                            <span key={b} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 text-xs font-semibold ${
                          staff.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            staff.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <span className="capitalize">{staff.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedUserForBranch(staff)}
                            className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                            title="Assign church branches"
                          >
                            Branches
                          </button>

                          <button
                            onClick={() => setSelectedUserForRole(staff)}
                            className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                            title="Change role"
                          >
                            Role
                          </button>

                          {!isCurrent && (
                            <>
                              <button
                                onClick={() => handleToggleSuspend(staff)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  staff.status === 'suspended'
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                }`}
                                title={staff.status === 'suspended' ? 'Reactivate staff' : 'Suspend staff'}
                              >
                                {staff.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => setUserToDelete(staff)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove staff member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVAL REQUESTS */}
      {tab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Pending Staff Registration Requests ({pendingUsers.length})
            </h3>
            <span className="text-xs text-slate-400">
              Accounts require administrator approval
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-700">All caught up!</div>
              <div>There are no pending staff registration requests at this time.</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingUsers.map(req => {
                const requestedIsAdmin = req.requestedRole === 'admin';
                const cannotApproveAdmin = requestedIsAdmin && isAdminLimitReached;

                return (
                  <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{req.fullName}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          requestedIsAdmin ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          Requested: {req.requestedRole}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.email}</span>
                        </span>
                        {req.phone && (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.phone}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>Branch: <strong>{req.primaryBranch}</strong></span>
                        </span>
                        <span className="text-slate-400">
                          Submitted: {req.createdAt.slice(0, 10)}
                        </span>
                      </div>

                      {cannotApproveAdmin && (
                        <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            System limit of 2 administrators reached. You may approve as a <strong>Teacher</strong> instead, or demote an existing administrator first.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {requestedIsAdmin && !cannotApproveAdmin ? (
                        <button
                          onClick={() => handleApprove(req, 'admin')}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve as Admin</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(req, 'teacher')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve as Teacher</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleReject(req)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => setUserToDelete(req)}
                        className="p-1.5 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                        title="Remove / Delete Request"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRM DELETE STAFF MODAL */}
      {userToDelete && (
        <ConfirmDeleteStaffModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* BRANCH ACCESS MODAL */}
      {selectedUserForBranch && (
        <BranchAccessModal
          user={selectedUserForBranch}
          onClose={() => setSelectedUserForBranch(null)}
          onSave={branches => handleSaveBranchAccess(selectedUserForBranch.id, branches)}
        />
      )}

      {/* CHANGE ROLE MODAL */}
      {selectedUserForRole && (
        <ChangeRoleModal
          user={selectedUserForRole}
          adminCount={adminCount}
          isGlobalAdmin={isGlobalAdmin}
          canAppointGlobalAdmin={isGlobalAdmin || globalAdminCount === 0 || users.length <= 1}
          onClose={() => setSelectedUserForRole(null)}
          onSave={newRole => handleChangeRole(selectedUserForRole, newRole)}
        />
      )}

    </div>
  );
};

// Sub-component: Branch Access Assignment Modal
const BranchAccessModal: React.FC<{
  user: User;
  onClose: () => void;
  onSave: (branches: ChurchBranch[]) => void;
}> = ({ user, onClose, onSave }) => {
  const [selectedBranches, setSelectedBranches] = useState<ChurchBranch[]>(user.authorizedBranches || [user.primaryBranch]);

  const toggleBranch = (b: ChurchBranch) => {
    if (selectedBranches.includes(b)) {
      if (selectedBranches.length === 1) return; // Must have at least 1
      setSelectedBranches(selectedBranches.filter(x => x !== b));
    } else {
      setSelectedBranches([...selectedBranches, b]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
        <h3 className="font-bold text-base text-slate-900 mb-1">
          Assign Church Branches
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Select church branches <strong className="text-slate-800">{user.fullName}</strong> is authorized to access and take attendance for.
        </p>

        <div className="space-y-2 mb-6">
          {CHURCH_BRANCHES.map(branch => {
            const isChecked = selectedBranches.includes(branch);
            return (
              <div
                key={branch}
                onClick={() => toggleBranch(branch)}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  isChecked
                    ? 'border-indigo-500 bg-indigo-50/50 font-bold text-indigo-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{branch}</span>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                }`}>
                  {isChecked && <Check className="w-3 h-3" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selectedBranches)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            Save Branch Permissions
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Change Role Modal
const ChangeRoleModal: React.FC<{
  user: User;
  adminCount: number;
  isGlobalAdmin: boolean;
  canAppointGlobalAdmin?: boolean;
  onClose: () => void;
  onSave: (role: UserRole) => void;
}> = ({ user, adminCount, isGlobalAdmin, canAppointGlobalAdmin, onClose, onSave }) => {
  const [role, setRole] = useState<UserRole>(user.role);
  const isCurrentlyAdmin = user.role === 'admin';
  const isAdminLimitReached = adminCount >= 2;
  const cannotBecomeAdmin = !isCurrentlyAdmin && isAdminLimitReached;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
        <h3 className="font-bold text-base text-slate-900 mb-1">
          Modify Staff Access Level
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Assign role for <strong className="text-slate-800">{user.fullName}</strong>.
        </p>

        <div className="space-y-3 mb-6">
          {/* Global Admin Option (Visible & selectable by Global Admins or when 0 global admins / sole user) */}
          {(isGlobalAdmin || canAppointGlobalAdmin) && (
            <button
              type="button"
              onClick={() => setRole('global_admin')}
              className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                role === 'global_admin'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-400'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-amber-900 font-extrabold">
                  <span>🌐 Global Administrator</span>
                  <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full uppercase">
                    Supreme
                  </span>
                </span>
                {role === 'global_admin' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </div>
              <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                Executive oversight across ALL church branches, multi-branch consolidated summaries, audit governance, and staff appointment authority.
              </p>
            </button>
          )}

          <button
            type="button"
            disabled={cannotBecomeAdmin}
            onClick={() => setRole('admin')}
            className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
              cannotBecomeAdmin
                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                : role === 'admin'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Branch Administrator</span>
              {role === 'admin' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-0.5">
              {cannotBecomeAdmin
                ? 'Maximum 2 branch administrators reached across the system.'
                : 'Full access: view complete guardian phone/email, add/edit/delete children, import spreadsheets, and manage team accounts.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
              role === 'teacher'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Regular User / Teacher</span>
              {role === 'teacher' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-0.5">
              Can view child names, birthdays, search register, and take branch attendance. Cannot view sensitive parent contact details.
            </p>
          </button>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(role)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            Confirm Role Update
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Confirm Delete Staff Modal
const ConfirmDeleteStaffModal: React.FC<{
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ user, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-lg text-slate-900 text-center mb-1">
          Remove Staff Member?
        </h3>
        <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
          Are you sure you want to permanently remove <strong className="text-slate-800">{user.fullName}</strong> ({user.role}) from {user.primaryBranch}? This will revoke their access to The Shelter Junior Church portal.
        </p>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-5 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="font-mono text-slate-700">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role:</span>
            <span className="font-bold capitalize text-slate-700">{user.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Primary Branch:</span>
            <span className="text-slate-700">{user.primaryBranch}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Yes, Remove Staff
          </button>
        </div>
      </div>
    </div>
  );
};

