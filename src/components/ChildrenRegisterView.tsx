import React, { useState, useMemo } from 'react';
import {
  Users2,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Shield,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Cake,
  Heart,
  AlertCircle,
  X,
  Check,
  Copy,
  UserCheck,
  MapPin
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService, calculateAge, formatAgeString } from '../services/storage';
import { exportChildrenToExcel } from '../services/exportImport';
import { Child, GuardianContact, ChurchBranch } from '../types';

interface ChildrenRegisterViewProps {
  onOpenAddChild: () => void;
  onOpenImport: () => void;
}

export const ChildrenRegisterView: React.FC<ChildrenRegisterViewProps> = ({
  onOpenAddChild,
  onOpenImport
}) => {
  const { activeBranch, isAdmin, currentUser } = useAuth();
  
  // State
  const [children, setChildren] = useState<Child[]>(() => StorageService.getChildren());
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [ageGroupFilter, setAgeGroupFilter] = useState<'All' | '0-3' | '4-7' | '8-11' | '12+'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // As specified in requirements

  // Selected child for viewing / editing / deleting
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter children for current active branch
  const branchChildren = useMemo(() => {
    return children.filter(c => c.branch === activeBranch);
  }, [children, activeBranch]);

  // Apply Search and Filters
  const filteredChildren = useMemo(() => {
    let result = branchChildren;
    const term = searchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter(c => {
        // Child's name match
        const nameMatch = c.fullName.toLowerCase().includes(term);
        if (nameMatch) return true;

        // If administrator, also search by guardian name, guardian phone number, or home address
        if (isAdmin) {
          if (c.homeAddress && c.homeAddress.toLowerCase().includes(term)) return true;
          if (c.guardians && c.guardians.length > 0) {
            const guardianMatch = c.guardians.some(g =>
              g.name.toLowerCase().includes(term) ||
              g.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, '')) ||
              (g.email && g.email.toLowerCase().includes(term))
            );
            if (guardianMatch) return true;
          }
        }

        return false;
      });
    }

    // Gender filter
    if (genderFilter !== 'All') {
      result = result.filter(c => c.gender === genderFilter);
    }

    // Age group filter
    if (ageGroupFilter !== 'All') {
      result = result.filter(c => {
        const age = calculateAge(c.dateOfBirth);
        if (ageGroupFilter === '0-3') return age >= 0 && age <= 3;
        if (ageGroupFilter === '4-7') return age >= 4 && age <= 7;
        if (ageGroupFilter === '8-11') return age >= 8 && age <= 11;
        if (ageGroupFilter === '12+') return age >= 12;
        return true;
      });
    }

    return result;
  }, [branchChildren, searchTerm, genderFilter, ageGroupFilter, isAdmin]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredChildren.length / itemsPerPage) || 1;
  const paginatedChildren = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredChildren.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChildren, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle Edit Submit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;

    StorageService.updateChild(editingChild, currentUser?.fullName || 'Admin', 'admin');
    setChildren(StorageService.getChildren());
    setEditingChild(null);
    setSaveSuccessMsg(`Record updated for ${editingChild.fullName}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deletingChildId) return;
    StorageService.deleteChild(deletingChildId, currentUser?.fullName || 'Admin', 'admin');
    setChildren(StorageService.getChildren());
    setDeletingChildId(null);
    setSelectedChild(null);
    setSaveSuccessMsg('Child record deleted successfully.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleExport = () => {
    exportChildrenToExcel(branchChildren, activeBranch);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Children's Register
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeBranch}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showing {filteredChildren.length} of {branchChildren.length} registered children in {activeBranch}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <>
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs flex items-center space-x-1.5 transition-colors"
                title="Export branch children to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
              <button
                onClick={onOpenImport}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Import File</span>
              </button>
              <button
                onClick={onOpenAddChild}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Child</span>
              </button>
            </>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                isAdmin
                  ? "Search by child's name, guardian name, phone, or home address..."
                  : "Search children by name..."
              }
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Gender Filter */}
          <div className="md:col-span-3 flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Gender:</span>
            {(['All', 'Male', 'Female'] as const).map(g => (
              <button
                key={g}
                onClick={() => {
                  setGenderFilter(g);
                  setCurrentPage(1);
                }}
                className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                  genderFilter === g
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Age Bracket Filter */}
          <div className="md:col-span-3">
            <select
              value={ageGroupFilter}
              onChange={e => {
                setAgeGroupFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Age Groups</option>
              <option value="0-3">Toddlers (0 - 3 yrs)</option>
              <option value="4-7">Beginners (4 - 7 yrs)</option>
              <option value="8-11">Juniors (8 - 11 yrs)</option>
              <option value="12+">Teens (12+ yrs)</option>
            </select>
          </div>

        </div>

        {/* Regular Teacher Privacy Warning Notice */}
        {!isAdmin && (
          <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              Teacher mode active: Guardian contact information is masked in accordance with child safeguarding rules. Contact an administrator for parent inquiries.
            </span>
          </div>
        )}
      </div>

      {/* Children Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {paginatedChildren.length === 0 ? (
          <div className="p-12 text-center">
            <Users2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No children found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || genderFilter !== 'All' || ageGroupFilter !== 'All'
                ? `No records matching "${searchTerm}" with active filters in ${activeBranch}.`
                : `There are currently no children registered in ${activeBranch}.`}
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              {(searchTerm || genderFilter !== 'All' || ageGroupFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setGenderFilter('All');
                    setAgeGroupFilter('All');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={onOpenAddChild}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                >
                  Register First Child
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Child Full Name</th>
                  <th className="py-3.5 px-4">Gender</th>
                  <th className="py-3.5 px-4">Date of Birth</th>
                  <th className="py-3.5 px-4">Current Age</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {paginatedChildren.map(child => {
                  const ageString = formatAgeString(child.dateOfBirth);
                  const firstGuardian = child.guardians?.[0];

                  return (
                    <tr
                      key={child.id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedChild(child)}
                    >
                      {/* Name & Notes preview */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            child.gender === 'Female'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {child.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {child.fullName}
                            </div>
                            {child.notes && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs font-normal">
                                {child.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          child.gender === 'Female'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {child.gender}
                        </span>
                      </td>

                      {/* Date of Birth */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {child.dateOfBirth}
                      </td>

                      {/* Current Age */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {ageString}
                      </td>

                      {/* Guardian Contact (Privacy check: Admin vs Teacher) */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          firstGuardian ? (
                            <div>
                              <div className="font-semibold text-slate-800 text-xs">
                                {firstGuardian.name} ({firstGuardian.relationship})
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {firstGuardian.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No contact added</span>
                          )
                        ) : (
                          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                            <Shield className="w-3.5 h-3.5 text-slate-300" />
                            <span className="italic">Protected (Admin only)</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedChild(child)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingChild(JSON.parse(JSON.stringify(child)))}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Child"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingChildId(child.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Child"
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
        )}

        {/* Pagination Bar (Max 10 per page) */}
        {filteredChildren.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{Math.min(filteredChildren.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
              <span className="font-semibold">{Math.min(filteredChildren.length, currentPage * itemsPerPage)}</span> of{' '}
              <span className="font-semibold">{filteredChildren.length}</span> children
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* VIEW CHILD PROFILE MODAL */}
      {selectedChild && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-linear-to-r from-indigo-700 to-indigo-900 text-white p-5 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  selectedChild.gender === 'Female' ? 'bg-rose-400 text-rose-950' : 'bg-blue-400 text-blue-950'
                }`}>
                  {selectedChild.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white leading-tight">{selectedChild.fullName}</h3>
                  <p className="text-xs text-indigo-200 font-medium">{selectedChild.branch}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChild(null)}
                className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Age</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {formatAgeString(selectedChild.dateOfBirth)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
                    {selectedChild.dateOfBirth}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Gender</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {selectedChild.gender}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedChild.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <div className="font-bold mb-0.5">Teacher Notes / Care Information:</div>
                  <p>{selectedChild.notes}</p>
                </div>
              )}

              {/* Guardian Information (Sensitive: Admin vs Teacher) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Parent / Guardian Contacts</span>
                  </h4>
                  {!isAdmin && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Protected
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  selectedChild.guardians && selectedChild.guardians.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedChild.guardians.map((g, idx) => (
                        <div key={g.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-800 text-sm">{g.name}</span>
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              {g.relationship || 'Guardian'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 mt-2">
                            {g.phone && (
                              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs">
                                <span className="flex items-center space-x-1.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{g.phone}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(g.phone)}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-sans font-semibold flex items-center space-x-0.5"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedPhone === g.phone ? 'Copied!' : 'Copy'}</span>
                                </button>
                              </div>
                            )}

                            {g.email && (
                              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{g.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No guardian details recorded for this child.
                    </div>
                  )
                ) : (
                  /* Protected View for Regular Teachers */
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-800">
                      Guardian Details Restricted
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      Parent contact numbers, email addresses, and home addresses are restricted to Church Administrators to safeguard child privacy.
                    </p>
                  </div>
                )}
              </div>

              {/* Home Address (Sensitive: Admin only) */}
              {isAdmin && selectedChild.homeAddress && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Home Address</span>
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800">
                    {selectedChild.homeAddress}
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Registered: {selectedChild.createdAt.slice(0, 10)}
              </span>

              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const childToEdit = selectedChild;
                      setSelectedChild(null);
                      setEditingChild(JSON.parse(JSON.stringify(childToEdit)));
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Edit Child
                  </button>
                )}
                <button
                  onClick={() => setSelectedChild(null)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EDIT CHILD MODAL (Admin Only) */}
      {editingChild && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in">
            <div className="bg-indigo-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Edit Child Record</h3>
              <button
                onClick={() => setEditingChild(null)}
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingChild.fullName}
                  onChange={e => setEditingChild({ ...editingChild, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={editingChild.dateOfBirth}
                    onChange={e => setEditingChild({ ...editingChild, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={editingChild.gender}
                    onChange={e => setEditingChild({ ...editingChild, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Home Address</label>
                <input
                  type="text"
                  value={editingChild.homeAddress || ''}
                  onChange={e => setEditingChild({ ...editingChild, homeAddress: e.target.value })}
                  placeholder="e.g. 12 Okota Palace Road, Lagos"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Care Information</label>
                <textarea
                  rows={2}
                  value={editingChild.notes || ''}
                  onChange={e => setEditingChild({ ...editingChild, notes: e.target.value })}
                  placeholder="Allergies, special needs, class group..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Guardian 1 */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Guardian 1</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Guardian Name"
                    value={editingChild.guardians[0]?.name || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[0]) updated[0] = { id: 'g1', name: '', relationship: 'Parent', phone: '' };
                      updated[0].name = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Mother)"
                    value={editingChild.guardians[0]?.relationship || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[0]) updated[0] = { id: 'g1', name: '', relationship: 'Parent', phone: '' };
                      updated[0].relationship = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={editingChild.guardians[0]?.phone || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[0]) updated[0] = { id: 'g1', name: '', relationship: 'Parent', phone: '' };
                      updated[0].phone = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={editingChild.guardians[0]?.email || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[0]) updated[0] = { id: 'g1', name: '', relationship: 'Parent', phone: '' };
                      updated[0].email = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Guardian 2 (Optional) */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Guardian 2 (Optional)</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Guardian 2 Name"
                    value={editingChild.guardians[1]?.name || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[1]) updated[1] = { id: 'g2', name: '', relationship: 'Father', phone: '' };
                      updated[1].name = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Father)"
                    value={editingChild.guardians[1]?.relationship || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[1]) updated[1] = { id: 'g2', name: '', relationship: 'Father', phone: '' };
                      updated[1].relationship = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={editingChild.guardians[1]?.phone || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[1]) updated[1] = { id: 'g2', name: '', relationship: 'Father', phone: '' };
                      updated[1].phone = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={editingChild.guardians[1]?.email || ''}
                    onChange={e => {
                      const updated = [...editingChild.guardians];
                      if (!updated[1]) updated[1] = { id: 'g2', name: '', relationship: 'Father', phone: '' };
                      updated[1].email = e.target.value;
                      setEditingChild({ ...editingChild, guardians: updated });
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingChild(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingChildId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-slate-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Delete Child Record?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to permanently delete this child's record? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setDeletingChildId(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
