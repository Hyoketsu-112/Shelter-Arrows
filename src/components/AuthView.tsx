import React, { useState } from 'react';
import {
  Church,
  Shield,
  KeyRound,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { ChurchLogo } from './ChurchLogo';
import { CHURCH_BRANCHES, ChurchBranch, UserRole } from '../types';
import { StorageService } from '../services/storage';
import churchLogoImg from '../assets/images/church_logo.jpg';

export const AuthView: React.FC = () => {
  const { login, register, requestPasswordReset, confirmPasswordReset, currentUser, logout } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset-code'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState(() => StorageService.getRememberedEmail());
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBranch, setRegBranch] = useState<ChurchBranch>('Shelter Okota');
  const [regRole, setRegRole] = useState<UserRole>('teacher');
  const [regPassword, setRegPassword] = useState('');

  // Password Reset Form
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const adminCount = StorageService.getAdminCount();
  const isAdminLimitReached = adminCount >= 2;

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your church staff email address.');
      return;
    }

    setLoading(true);
    const res = await login(loginEmail, loginPassword, rememberMe);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Unable to sign in. Please verify your email.');
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (regRole === 'admin' && isAdminLimitReached) {
      setErrorMsg('The system has reached the limit of 2 administrators. Please request a Teacher account.');
      return;
    }

    setLoading(true);
    const res = await register({
      fullName,
      email: regEmail,
      phone: regPhone,
      branch: regBranch,
      requestedRole: regRole
    });
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
    }
  };

  // Handle Forgot Password Request
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your account email.');
      return;
    }

    setLoading(true);
    const res = await requestPasswordReset(resetEmail);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setGeneratedCode(res.tempCode || '847291');
      setResetCode(res.tempCode || '');
      setSuccessMsg(`Verification code issued for demo testing: ${res.tempCode}`);
      setMode('reset-code');
    }
  };

  // Handle Password Reset Confirm
  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetCode.trim() || !newPassword.trim()) {
      setErrorMsg('Please provide the 6-digit code and a new password.');
      return;
    }

    setLoading(true);
    const res = await confirmPasswordReset(resetEmail, resetCode, newPassword);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
      setMode('signin');
      setLoginEmail(resetEmail);
    }
  };

  // If user is currently pending approval
  if (currentUser && currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Account Awaiting Approval
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Welcome, <span className="font-semibold text-slate-900">{currentUser.fullName}</span>!
            Your staff account request has been registered and is pending administrator authorization.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 mb-6 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Church Branch:</span>
              <span className="font-semibold text-slate-800">{currentUser.primaryBranch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Role:</span>
              <span className="font-semibold uppercase tracking-wider text-indigo-700">{currentUser.requestedRole}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email Address:</span>
              <span className="font-medium text-slate-800">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submission Date:</span>
              <span className="text-slate-600">{currentUser.createdAt.slice(0, 10)}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-6 space-y-2 text-left">
            <p className="font-semibold text-slate-800">
              Your registration request has been submitted to the church administration for verification and branch assignment.
            </p>
            <p className="text-slate-500">
              Once authorized by an administrator, you will be able to log in directly to your assigned church branch.
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-indigo-50/30 to-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-block p-2.5 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200/90 mb-3">
          <img
            src={churchLogoImg}
            alt="The Shelter Junior Church"
            className="w-20 h-20 object-contain mx-auto rounded-xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.jpg';
            }}
          />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          The Shelter Junior Church
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Children's Register, Birthdays & Attendance Portal
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200">
          
          {/* Notifications / Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Staff Sign In</h2>
                <p className="text-xs text-slate-500">Access your assigned branch records</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="teacher@theshelter.org"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        setMode('forgot');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                    />
                    <span>Remember my account on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In to Portal'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-600 pt-5 border-t border-slate-100">
                New church teacher or leader?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('signup');
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Request Staff Account
                </button>
              </div>
            </div>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <div>
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="flex items-center text-xs text-slate-500 hover:text-slate-800 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                </button>
                <h2 className="text-lg font-bold text-slate-900">Request Staff Account</h2>
                <p className="text-xs text-slate-500">Requires administrator approval prior to activation</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sister Abigail Mensah"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="name@theshelter.org"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+234 800 000 0000"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Church Branch
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={regBranch}
                      onChange={e => setRegBranch(e.target.value as ChurchBranch)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {CHURCH_BRANCHES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Access Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        regRole === 'teacher'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>Teacher</span>
                        {regRole === 'teacher' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Attendance, names, birthdays
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={isAdminLimitReached}
                      onClick={() => setRegRole('admin')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        isAdminLimitReached
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                          : regRole === 'admin'
                            ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold ring-1 ring-amber-500'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>Administrator</span>
                        {regRole === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {isAdminLimitReached ? 'Limit reached (2/2)' : 'Full records & staff control'}
                      </p>
                    </button>
                  </div>

                  {isAdminLimitReached && (
                    <p className="text-[11px] text-amber-700 mt-1.5 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>The system has reached the limit of 2 administrators.</span>
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Submitting Request...' : 'Submit Request for Approval'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD: REQUEST */}
          {mode === 'forgot' && (
            <div>
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="flex items-center text-xs text-slate-500 hover:text-slate-800 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                </button>
                <h2 className="text-lg font-bold text-slate-900">Password Recovery</h2>
                <p className="text-xs text-slate-500">Enter your registered email to receive a verification code</p>
              </div>

              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="teacher@theshelter.org"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD: ENTER CODE & RESET */}
          {mode === 'reset-code' && (
            <div>
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="flex items-center text-xs text-slate-500 hover:text-slate-800 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </button>
                <h2 className="text-lg font-bold text-slate-900">Verify & Reset Password</h2>
                <p className="text-xs text-slate-500">Enter the verification code and set a new password</p>
              </div>

              {generatedCode && (
                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Demo Verification Code:</span>
                  </div>
                  <span className="font-mono text-base font-bold tracking-widest text-indigo-700">{generatedCode}</span>
                </div>
              )}

              <form onSubmit={handleResetConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      maxLength={6}
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-wider border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
