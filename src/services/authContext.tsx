import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ChurchBranch, UserRole, AccountStatus } from '../types';
import { StorageService } from './storage';
import { isSupabaseConfigured, supabase } from './supabase';

interface AuthContextType {
  currentUser: User | null;
  activeBranch: ChurchBranch;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGlobalAdmin: boolean;
  isApproved: boolean;
  setActiveBranch: (branch: ChurchBranch) => void;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    requestedRole: UserRole;
    branch: ChurchBranch;
    password?: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; tempCode?: string }>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  refreshCurrentUser: () => void;
  deleteAccount: () => Promise<{ success: boolean; message: string }>;
  elevateToGlobalAdmin: (userId?: string) => Promise<{ success: boolean; message: string; user?: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const profileToUser = (profile: Record<string, unknown>): User => ({
  id: String(profile.id),
  fullName: String(profile.full_name),
  email: String(profile.email),
  phone: profile.phone ? String(profile.phone) : undefined,
  role: profile.role as UserRole,
  requestedRole: profile.requested_role as UserRole,
  primaryBranch: profile.primary_branch as ChurchBranch,
  authorizedBranches: (profile.authorized_branches as ChurchBranch[]) || [],
  status: profile.status as AccountStatus,
  createdAt: String(profile.created_at),
  approvedAt: profile.approved_at ? String(profile.approved_at) : undefined,
  approvedBy: profile.approved_by ? String(profile.approved_by) : undefined
});

const getSupabaseProfile = async (userId: string): Promise<User | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return profileToUser(data);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [activeBranch, setActiveBranchState] = useState<ChurchBranch>(() => {
    const saved = StorageService.getActiveBranch();
    return saved;
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let mounted = true;
    const hydrateSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        setCurrentUser(null);
        return;
      }
      const profile = await getSupabaseProfile(data.session.user.id);
      if (mounted) {
        setCurrentUser(profile);
        StorageService.setCurrentUser(profile);
      }
    };

    hydrateSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void hydrateSession(), 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // If user is regular teacher with specific authorized branches, sync active branch
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'global_admin') {
        // Admins and Global Admins have universal access to all branches
        return;
      }
      if (currentUser.authorizedBranches && currentUser.authorizedBranches.length > 0) {
        if (!currentUser.authorizedBranches.includes(activeBranch)) {
          const fallback = currentUser.authorizedBranches[0];
          setActiveBranchState(fallback);
          StorageService.setActiveBranch(fallback);
        }
      }
    }
  }, [currentUser]);

  const setActiveBranch = (branch: ChurchBranch) => {
    setActiveBranchState(branch);
    StorageService.setActiveBranch(branch);
  };

  const refreshCurrentUser = () => {
    const refreshed = StorageService.getCurrentUser();
    setCurrentUser(refreshed);
  };

  const login = async (email: string, password?: string, rememberMe = true): Promise<{ success: boolean; message?: string; user?: User }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password || ''
      });
      if (error || !data.user) {
        return { success: false, message: error?.message || 'Unable to sign in.' };
      }

      const user = await getSupabaseProfile(data.user.id);
      if (!user) {
        return { success: false, message: 'Your account profile has not been created yet. Please contact an administrator.' };
      }
      if (user.status === 'pending') {
        setCurrentUser(user);
        return { success: false, message: 'Your account is awaiting administrator approval.', user };
      }
      if (user.status === 'suspended' || user.status === 'rejected') {
        return { success: false, message: `This account has been ${user.status}.` };
      }

      StorageService.setCurrentUser(user);
      if (rememberMe) StorageService.setRememberedEmail(user.email);
      setCurrentUser(user);
      setActiveBranch(user.authorizedBranches.includes(activeBranch) ? activeBranch : user.primaryBranch);
      return { success: true, user };
    }

    const users = StorageService.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'No account found with this email address. Please sign up or check your spelling.' };
    }

    if (user.status === 'suspended') {
      return { success: false, message: 'This account has been suspended by an administrator.' };
    }

    if (user.status === 'rejected') {
      return { success: false, message: 'This account registration request was not approved.' };
    }

    // Set current user and handle remember preference
    StorageService.setCurrentUser(user);
    if (rememberMe) {
      StorageService.setRememberedEmail(user.email);
    } else {
      StorageService.setRememberedEmail(null);
    }
    setCurrentUser(user);

    // Set branch
    if (user.authorizedBranches.length > 0) {
      if (!user.authorizedBranches.includes(activeBranch)) {
        setActiveBranch(user.authorizedBranches[0]);
      }
    } else {
      setActiveBranch(user.primaryBranch);
    }

    StorageService.logActivity({
      userName: user.fullName,
      userRole: user.role,
      branch: user.primaryBranch,
      action: 'Staff Signed In',
      details: `${user.fullName} signed into the portal`,
      type: 'auth'
    });

    return { success: true, user };
  };

  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    requestedRole: UserRole;
    branch: ChurchBranch;
    password?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    if (isSupabaseConfigured && supabase) {
      if (!data.password) {
        return { success: false, message: 'Please create a password for your account.' };
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            phone: data.phone.trim(),
            requested_role: data.requestedRole,
            primary_branch: data.branch
          }
        }
      });

      if (error || !signUpData.user) {
        return { success: false, message: error?.message || 'Unable to create your account.' };
      }

      const user = signUpData.session ? await getSupabaseProfile(signUpData.user.id) : null;
      if (user) {
        StorageService.setCurrentUser(user);
        setCurrentUser(user);
        setActiveBranch(user.primaryBranch);
      }

      return {
        success: true,
        message: user?.role === 'global_admin'
          ? 'Welcome! Your account has been configured as the initial Global Administrator.'
          : signUpData.session
            ? 'Account registration submitted successfully. An administrator must approve your account.'
            : 'Account created. Check your email to confirm your address, then sign in.'
      };
    }

    const users = StorageService.getUsers();
    const cleanEmail = data.email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    // Check 2 admin limit if requesting admin
    if (data.requestedRole === 'admin') {
      const currentAdmins = StorageService.getAdminCount();
      if (currentAdmins >= 2) {
        return {
          success: false,
          message: 'The system has reached the maximum limit of 2 administrators. You may register as a Teacher instead.'
        };
      }
    }

    const isFirstOrOnlyUser = users.length === 0 || !users.some(u => u.status === 'approved' && (u.role === 'admin' || u.role === 'global_admin'));

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      role: isFirstOrOnlyUser ? 'global_admin' : data.requestedRole,
      requestedRole: data.requestedRole,
      primaryBranch: data.branch,
      authorizedBranches: isFirstOrOnlyUser ? ['Shelter Okota', 'Community Church', 'Anthony Church'] : [data.branch],
      status: isFirstOrOnlyUser ? 'approved' : 'pending', // Auto-approved if first/only user
      approvedAt: isFirstOrOnlyUser ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    StorageService.saveUsers(users);

    // Automatically set as current user
    StorageService.setCurrentUser(newUser);
    setCurrentUser(newUser);
    setActiveBranch(data.branch);

    StorageService.logActivity({
      userName: newUser.fullName,
      userRole: newUser.role,
      branch: newUser.primaryBranch,
      action: isFirstOrOnlyUser ? 'Global Administrator Initialized' : 'Account Request Created',
      details: isFirstOrOnlyUser
        ? `Initial account created and automatically designated as Global Administrator for ${newUser.primaryBranch}.`
        : `New ${newUser.requestedRole} account requested for ${newUser.primaryBranch}. Awaiting admin approval.`,
      type: 'auth'
    });

    return {
      success: true,
      message: isFirstOrOnlyUser
        ? 'Welcome! As the initial church staff member, your account has been automatically configured as Global Administrator.'
        : 'Account registration submitted successfully! An administrator must approve your account before full access is granted.',
      user: newUser
    };
  };

  const logout = () => {
    if (currentUser) {
      StorageService.logActivity({
        userName: currentUser.fullName,
        userRole: currentUser.role,
        branch: activeBranch,
        action: 'Staff Signed Out',
        details: `${currentUser.fullName} signed out`,
        type: 'auth'
      });
    }
    if (isSupabaseConfigured && supabase) void supabase.auth.signOut();
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string; tempCode?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const users = StorageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'We could not find an account with that email address.' };
    }

    // Generate a 6-digit simulation code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`reset_code_${cleanEmail}`, code);

    return {
      success: true,
      message: `Password reset verification code generated for ${cleanEmail}. In a production environment, this is dispatched via transactional email.`,
      tempCode: code
    };
  };

  const confirmPasswordReset = async (email: string, code: string, _newPassword: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const savedCode = sessionStorage.getItem(`reset_code_${cleanEmail}`);

    if (!savedCode || savedCode !== code.trim()) {
      return { success: false, message: 'Invalid or expired verification code. Please check and try again.' };
    }

    sessionStorage.removeItem(`reset_code_${cleanEmail}`);
    return {
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new credentials.'
    };
  };

  const deleteAccount = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'No active session found.' };
    }
    const res = StorageService.deleteOwnAccount(currentUser.id);
    if (res.success) {
      setCurrentUser(null);
    }
    return res;
  };

  const elevateToGlobalAdmin = async (userId?: string): Promise<{ success: boolean; message: string; user?: User }> => {
    const targetId = userId || currentUser?.id;
    if (!targetId) {
      return { success: false, message: 'No target user specified.' };
    }
    const res = StorageService.makeUserGlobalAdmin(targetId);
    if (res.success && res.user) {
      if (!currentUser || currentUser.id === targetId) {
        setCurrentUser(res.user);
      }
    }
    return res;
  };

  const isAuthenticated = !!currentUser;
  const isApproved = currentUser?.status === 'approved';
  const isGlobalAdmin = currentUser?.role === 'global_admin' && isApproved;
  const isAdmin = (currentUser?.role === 'admin' || currentUser?.role === 'global_admin') && isApproved;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeBranch,
        isAuthenticated,
        isAdmin,
        isGlobalAdmin,
        isApproved,
        setActiveBranch,
        login,
        register,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        refreshCurrentUser,
        deleteAccount,
        elevateToGlobalAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
