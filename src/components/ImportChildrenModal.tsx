import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService } from '../services/storage';
import {
  parseFileToData,
  autoDetectColumnMapping,
  validateImportRows,
  downloadSampleSpreadsheet,
  ColumnMapping,
  ValidatedChildRow
} from '../services/exportImport';

interface ImportChildrenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportChildrenModal: React.FC<ImportChildrenModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { activeBranch, currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    guardianPhone: '',
    guardianEmail: '',
    homeAddress: '',
    fullName: '',
    gender: '',
    notes: '',
    guardianName: ''
  });
  const [validatedRows, setValidatedRows] = useState<ValidatedChildRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterInvalidOnly, setFilterInvalidOnly] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const parsed = await parseFileToData(file);
      setFileName(parsed.fileName);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto detect columns using the 6 standard fields
      const detected = autoDetectColumnMapping(parsed.headers);
      setMapping(detected);

      setStep('mapping');
    } catch (err: any) {
      alert(`Error reading spreadsheet file: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleValidate = () => {
    const existingChildren = StorageService.getChildren();
    const evaluated = validateImportRows(rawRows, mapping, existingChildren, activeBranch);
    setValidatedRows(evaluated);
    setStep('preview');
  };

  const handleCommitImport = () => {
    const validRows = validatedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid records to import.');
      return;
    }

    let count = 0;
    validRows.forEach(r => {
      StorageService.addChild(
        {
          fullName: r.parsedData.fullName,
          dateOfBirth: r.parsedData.dateOfBirth,
          gender: r.parsedData.gender,
          branch: activeBranch,
          homeAddress: r.parsedData.homeAddress,
          notes: r.parsedData.notes,
          guardians: r.parsedData.guardians
        },
        currentUser?.fullName || 'Admin',
        'admin'
      );
      count++;
    });

    const skipped = validatedRows.length - count;
    setImportSummary({ imported: count, skipped });
    setTimeout(() => {
      onImportComplete();
      onClose();
    }, 2200);
  };

  const validCount = validatedRows.filter(r => r.isValid).length;
  const invalidCount = validatedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in">
        
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Import Children to {activeBranch}
              </h3>
              <p className="text-xs text-indigo-200">
                Excel (.xlsx, .xls) and CSV import following your 6-column format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <div className={`flex items-center space-x-2 font-semibold ${step === 'upload' ? 'text-indigo-600' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>1</span>
              <span>Upload Spreadsheet</span>
            </div>
            <div className={`flex items-center space-x-2 font-semibold ${step === 'mapping' ? 'text-indigo-600' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'mapping' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>2</span>
              <span>Match 6 Standard Columns</span>
            </div>
            <div className={`flex items-center space-x-2 font-semibold ${step === 'preview' ? 'text-indigo-600' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
              <span>Validation & Review</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={() => downloadSampleSpreadsheet('xlsx')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample .xlsx</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => downloadSampleSpreadsheet('csv')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample .csv</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              
              {/* 6-Column Format Banner */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                <span className="text-xs font-bold text-indigo-900 block mb-1.5 flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Standard 6-Column Import Format:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 font-medium text-slate-800">
                    <span className="font-bold text-indigo-600 block text-[10px]">1.</span> First Name
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 font-medium text-slate-800">
                    <span className="font-bold text-indigo-600 block text-[10px]">2.</span> Last Name
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 font-medium text-slate-800">
                    <span className="font-bold text-indigo-600 block text-[10px]">3.</span> Date of Birth
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 font-medium text-slate-800">
                    <span className="font-bold text-indigo-600 block text-[10px]">4.</span> Guardian's Phone
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 font-medium text-slate-800">
                    <span className="font-bold text-indigo-600 block text-[10px]">5.</span> Email
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100 font-medium text-slate-800">
                    <span className="font-bold text-indigo-600 block text-[10px]">6.</span> Home Address
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-10 text-center cursor-pointer transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Click or drag and drop your spreadsheet here
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports Excel (.xlsx, .xls) and CSV. Columns are automatically mapped to your 6 standard fields.
                </p>
                <div className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  <span>Target Branch:</span>
                  <strong className="text-indigo-600">{activeBranch}</strong>
                </div>
              </div>

              {/* Sample Download Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 block">Download 6-column pre-formatted template:</span>
                  <span className="text-slate-500">Includes example rows with First Name, Last Name, Date of Birth, Guardian Phone, Email, and Home Address.</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => downloadSampleSpreadsheet('xlsx')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 shadow-2xs flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download .xlsx</span>
                  </button>
                  <button
                    onClick={() => downloadSampleSpreadsheet('csv')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 shadow-2xs flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Download .csv</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Map Your Spreadsheet Columns</h4>
                  <p className="text-xs text-slate-500">
                    File: <span className="font-mono font-semibold">{fileName}</span> ({rawRows.length} rows found)
                  </p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Choose another file
                </button>
              </div>

              {/* The 6 Standard Columns Grid */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
                  Standard 6-Column Format Mapping
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* 1. First Name */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>First Name Column *</span>
                    </label>
                    <select
                      value={mapping.firstName}
                      onChange={e => setMapping({ ...mapping, firstName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Last Name */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>Last Name Column *</span>
                    </label>
                    <select
                      value={mapping.lastName}
                      onChange={e => setMapping({ ...mapping, lastName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Date of Birth */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>Date of Birth Column *</span>
                    </label>
                    <select
                      value={mapping.dateOfBirth}
                      onChange={e => setMapping({ ...mapping, dateOfBirth: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Guardian's Phone Number */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">4</span>
                      <span>Guardian's Phone Number Column</span>
                    </label>
                    <select
                      value={mapping.guardianPhone}
                      onChange={e => setMapping({ ...mapping, guardianPhone: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (Optional) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Email */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">5</span>
                      <span>Email Column</span>
                    </label>
                    <select
                      value={mapping.guardianEmail}
                      onChange={e => setMapping({ ...mapping, guardianEmail: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (Optional) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Home Address */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">6</span>
                      <span>Home Address Column</span>
                    </label>
                    <select
                      value={mapping.homeAddress}
                      onChange={e => setMapping({ ...mapping, homeAddress: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (Optional) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Optional Fallback single Full Name column if spreadsheet uses single column */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-500">
                    <div>
                      <label className="block font-semibold mb-1">Or Single Combined Full Name Column:</label>
                      <select
                        value={mapping.fullName || ''}
                        onChange={e => setMapping({ ...mapping, fullName: e.target.value })}
                        className="w-full p-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                      >
                        <option value="">-- (Optional if First/Last Name already chosen) --</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Gender Column (Optional):</label>
                      <select
                        value={mapping.gender || ''}
                        onChange={e => setMapping({ ...mapping, gender: e.target.value })}
                        className="w-full p-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                      >
                        <option value="">-- (Default: Male/Optional) --</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={(!mapping.firstName && !mapping.lastName && !mapping.fullName) || !mapping.dateOfBirth}
                  onClick={handleValidate}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 flex items-center space-x-1.5"
                >
                  <span>Validate Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION RESULTS */}
          {step === 'preview' && (
            <div className="space-y-4">
              
              {/* Validation Summary Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Rows</div>
                  <div className="text-lg font-extrabold text-slate-800">{validatedRows.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-emerald-600">Valid Records Ready</div>
                  <div className="text-lg font-extrabold text-emerald-700">{validCount}</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-rose-600">Invalid / Duplicates Skipped</div>
                  <div className="text-lg font-extrabold text-rose-700">{invalidCount}</div>
                </div>
              </div>

              {/* Success Notification if import was triggered */}
              {importSummary && (
                <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">Import Completed Successfully!</div>
                    <div>Added {importSummary.imported} new children to {activeBranch}. ({importSummary.skipped} invalid rows skipped).</div>
                  </div>
                </div>
              )}

              {/* Filter invalid only checkbox */}
              {invalidCount > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterInvalidOnly}
                      onChange={e => setFilterInvalidOnly(e.target.checked)}
                      className="rounded-sm border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Show only rows with validation errors ({invalidCount})</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    The system will automatically import only valid records and skip invalid ones.
                  </span>
                </div>
              )}

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">First Name</th>
                      <th className="py-2.5 px-3">Last Name</th>
                      <th className="py-2.5 px-3">Date of Birth</th>
                      <th className="py-2.5 px-3">Guardian Phone</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Home Address</th>
                      <th className="py-2.5 px-3">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validatedRows
                      .filter(r => (filterInvalidOnly ? !r.isValid : true))
                      .map(r => (
                        <tr
                          key={r.rowNumber}
                          className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                        >
                          <td className="py-2 px-3 font-mono text-slate-500">#{r.rowNumber}</td>
                          <td className="py-2 px-3">
                            {r.isValid ? (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                <Check className="w-3 h-3" />
                                <span>Valid</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                <X className="w-3 h-3" />
                                <span>Error</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {r.parsedData.firstName || <span className="text-rose-500 italic">Missing</span>}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {r.parsedData.lastName || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {r.parsedData.dateOfBirth || <span className="text-rose-500 italic">Invalid Date</span>}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {r.parsedData.guardians[0]?.phone || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-2 px-3">
                            {r.parsedData.guardians[0]?.email || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-2 px-3 max-w-xs truncate">
                            {r.parsedData.homeAddress || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-2 px-3">
                            {r.isValid ? (
                              <span className="text-emerald-700 text-[11px] font-semibold">Ready to import</span>
                            ) : (
                              <div className="space-y-0.5 text-rose-700 font-medium text-[11px]">
                                {r.errors.map((err, i) => (
                                  <div key={i} className="flex items-center space-x-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span>{err}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Adjust Column Mapping
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={validCount === 0 || !!importSummary}
                    onClick={handleCommitImport}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
                  >
                    Import {validCount} Valid {validCount === 1 ? 'Record' : 'Records'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
