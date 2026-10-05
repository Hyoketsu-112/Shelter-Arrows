import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Calendar,
  User,
  Phone,
  Mail,
  Shield,
  Building,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService, formatAgeString } from '../services/storage';
import { CHURCH_BRANCHES, ChurchBranch, GuardianContact } from '../types';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded: () => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onChildAdded
}) => {
  const { activeBranch, currentUser, isAdmin } = useAuth();

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [branch, setBranch] = useState<ChurchBranch>(activeBranch);
  const [homeAddress, setHomeAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Guardian 1
  const [g1Name, setG1Name] = useState('');
  const [g1Phone, setG1Phone] = useState('');
  const [g1Email, setG1Email] = useState('');
  const [g1Rel, setG1Rel] = useState('Mother');

  // Guardian 2
  const [g2Name, setG2Name] = useState('');
  const [g2Phone, setG2Phone] = useState('');
  const [g2Email, setG2Email] = useState('');
  const [g2Rel, setG2Rel] = useState('Father');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculatedAge = dateOfBirth ? formatAgeString(dateOfBirth) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !dateOfBirth) {
      setErrorMsg('Child full name and date of birth are required.');
      return;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    if (birthDate > today) {
      setErrorMsg('Date of birth cannot be in the future.');
      return;
    }

    // Assemble guardians
    const guardians: GuardianContact[] = [];
    if (g1Name.trim() || g1Phone.trim()) {
      guardians.push({
        id: `g-${Date.now()}-1`,
        name: g1Name.trim() || 'Parent',
        phone: g1Phone.trim(),
        email: g1Email.trim() || undefined,
        relationship: g1Rel
      });
    }

    if (g2Name.trim() || g2Phone.trim()) {
      guardians.push({
        id: `g-${Date.now()}-2`,
        name: g2Name.trim() || 'Guardian 2',
        phone: g2Phone.trim(),
        email: g2Email.trim() || undefined,
        relationship: g2Rel
      });
    }

    StorageService.addChild(
      {
        fullName: fullName.trim(),
        dateOfBirth,
        gender,
        branch,
        homeAddress: homeAddress.trim() || undefined,
        notes: notes.trim() || undefined,
        guardians
      },
      currentUser?.fullName || 'Church Staff',
      isAdmin ? 'admin' : 'teacher'
    );

    // Reset Form
    setFullName('');
    setDateOfBirth('');
    setHomeAddress('');
    setNotes('');
    setG1Name('');
    setG1Phone('');
    setG1Email('');
    setG2Name('');
    setG2Phone('');
    setG2Email('');

    onChildAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Register New Child</h3>
              <p className="text-xs text-indigo-200">The Shelter Junior Church Records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Branch & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Child Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel David"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch *
              </label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value as ChurchBranch)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {CHURCH_BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DOB, Gender & Live Age Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {calculatedAge && (
                <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Calculated Age: {calculatedAge}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    gender === 'Male'
                      ? 'bg-blue-50 text-blue-700 border-blue-400 ring-1 ring-blue-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  👦 Boy (Male)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    gender === 'Female'
                      ? 'bg-rose-50 text-rose-700 border-rose-400 ring-1 ring-rose-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  👧 Girl (Female)
                </button>
              </div>
            </div>
          </div>

          {/* Home Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Home Address
            </label>
            <input
              type="text"
              placeholder="e.g. 12 Okota Palace Road, Lagos"
              value={homeAddress}
              onChange={e => setHomeAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Special Care Information
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Peanut allergies, asthma inhaler, class group (Toddlers / Juniors), etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Guardian 1 */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Primary Parent / Guardian Contact</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Guardian Full Name"
                value={g1Name}
                onChange={e => setG1Name(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={g1Rel}
                onChange={e => setG1Rel(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Legal Guardian</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Aunt">Aunt</option>
                <option value="Uncle">Uncle</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. +234...)"
                  value={g1Phone}
                  onChange={e => setG1Phone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={g1Email}
                  onChange={e => setG1Email(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Guardian 2 (Optional) */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Secondary Guardian Contact (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Second Guardian Name"
                value={g2Name}
                onChange={e => setG2Name(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={g2Rel}
                onChange={e => setG2Rel(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Legal Guardian</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="tel"
                  placeholder="Second Phone Number"
                  value={g2Phone}
                  onChange={e => setG2Phone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  placeholder="Second Email Address"
                  value={g2Email}
                  onChange={e => setG2Email(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Register Child
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
