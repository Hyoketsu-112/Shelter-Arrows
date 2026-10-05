import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  ArrowRight,
  Check,
  RefreshCw,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
  AlertTriangle
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
  const [activeTab, setActiveTab] = useState<'all' | 'complete' | 'incomplete' | 'duplicates'>('all');
  const [importIncomplete, setImportIncomplete] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importSummary, setImportSummary] = useState<{
    totalImported: number;
    completeCount: number;
    incompleteCount: number;
    duplicatesSkipped: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const parsed = await parseFileToData(file);
      setFileName(parsed.fileName);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto detect columns
      const detected = autoDetectColumnMapping(parsed.headers);
      setMapping(detected);

      setStep('mapping');
    } catch (err: any) {
      alert(`Error reading spreadsheet: ${err.message || 'Invalid format'}`);
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

  const handleCommitImport = (onlyComplete = false) => {
    let rowsToImport = validatedRows.filter(r => r.canImport);

    if (onlyComplete) {
      rowsToImport = rowsToImport.filter(r => r.isComplete);
    } else if (!importIncomplete) {
      rowsToImport = rowsToImport.filter(r => r.isComplete);
    }

    if (skipDuplicates) {
      rowsToImport = rowsToImport.filter(r => !r.isDuplicate);
    }

    if (rowsToImport.length === 0) {
      alert('No rows selected for import based on your current settings.');
      return;
    }

    let completeCount = 0;
    let incompleteCount = 0;

    rowsToImport.forEach(r => {
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
        currentUser?.fullName || 'Administrator',
        currentUser?.role || 'admin'
      );

      if (r.isComplete) {
        completeCount++;
      } else {
        incompleteCount++;
      }
    });

    const duplicatesSkipped = skipDuplicates ? validatedRows.filter(r => r.isDuplicate).length : 0;

    setImportSummary({
      totalImported: completeCount + incompleteCount,
      completeCount,
      incompleteCount,
      duplicatesSkipped
    });

    setTimeout(() => {
      onImportComplete();
      onClose();
    }, 2400);
  };

  // Statistics
  const totalCount = validatedRows.length;
  const completeCount = validatedRows.filter(r => r.isComplete && !r.isEmpty).length;
  const incompleteCount = validatedRows.filter(r => !r.isComplete && r.canImport).length;
  const duplicateCount = validatedRows.filter(r => r.isDuplicate).length;

  const filteredRows = validatedRows.filter(r => {
    if (activeTab === 'complete') return r.isComplete && !r.isEmpty;
    if (activeTab === 'incomplete') return !r.isComplete && r.canImport;
    if (activeTab === 'duplicates') return r.isDuplicate;
    return true;
  });

  const importableCount = validatedRows.filter(r => {
    if (!r.canImport) return false;
    if (!importIncomplete && !r.isComplete) return false;
    if (skipDuplicates && r.isDuplicate) return false;
    return true;
  }).length;

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
                Upload any Excel (.xlsx, .xls) or CSV file — complete or incomplete
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
              <span>Match Columns (Flexible)</span>
            </div>
            <div className={`flex items-center space-x-2 font-semibold ${step === 'preview' ? 'text-indigo-600' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
              <span>Review & Import</span>
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
              
              {/* Universal Tolerance Banner */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs text-emerald-950">
                  <span className="font-bold block text-emerald-900 mb-0.5">
                    Universal File Support — Complete or Incomplete Files Allowed
                  </span>
                  <p className="text-emerald-800 leading-relaxed">
                    You can upload spreadsheets with any number of columns or rows. If information is missing (such as birth dates, parent telephone numbers, or residential addresses), the system automatically applies safe defaults so records are saved and can be completed anytime later.
                  </p>
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
                  Supports Excel (.xlsx, .xls) and CSV. Upload full registers or partial sheets with only names or basic details.
                </p>
                <div className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  <span>Target Branch:</span>
                  <strong className="text-indigo-600">{activeBranch}</strong>
                </div>
              </div>

              {/* Sample Download Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 block">Need a starting template?</span>
                  <span className="text-slate-500">Download the standard 6-column template with sample data.</span>
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
                  <h4 className="text-sm font-bold text-slate-900">Review & Map Columns</h4>
                  <p className="text-xs text-slate-500">
                    File: <span className="font-mono font-semibold">{fileName}</span> ({rawRows.length} rows found)
                  </p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Choose another file
                </button>
              </div>

              {/* Helpful Callout */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-center space-x-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>All columns are optional!</strong> Match the fields present in your file. Any unmapped or missing fields will be automatically filled with smart defaults so you can import the entire list right away.
                </span>
              </div>

              {/* Mapping Controls Grid */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
                  Spreadsheet Column Matcher
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* 1. First Name */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">1</span>
                        <span>First Name</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Optional</span>
                    </label>
                    <select
                      value={mapping.firstName}
                      onChange={e => setMapping({ ...mapping, firstName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Auto / None --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Last Name */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">2</span>
                        <span>Last Name</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Optional</span>
                    </label>
                    <select
                      value={mapping.lastName}
                      onChange={e => setMapping({ ...mapping, lastName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Auto / None --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Combined Full Name Option */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">★</span>
                        <span>Or Single Combined Full Name</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Optional</span>
                    </label>
                    <select
                      value={mapping.fullName || ''}
                      onChange={e => setMapping({ ...mapping, fullName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (If full name in single column) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Date of Birth */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">3</span>
                        <span>Date of Birth / Age</span>
                      </span>
                      <span className="text-[10px] font-normal text-amber-600">Defaults if blank</span>
                    </label>
                    <select
                      value={mapping.dateOfBirth}
                      onChange={e => setMapping({ ...mapping, dateOfBirth: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Auto / Default Date (2018-01-01) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Guardian's Phone Number */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">4</span>
                        <span>Guardian Phone</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Optional</span>
                    </label>
                    <select
                      value={mapping.guardianPhone}
                      onChange={e => setMapping({ ...mapping, guardianPhone: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (Optional / None) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Email */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">5</span>
                        <span>Email</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Optional</span>
                    </label>
                    <select
                      value={mapping.guardianEmail}
                      onChange={e => setMapping({ ...mapping, guardianEmail: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (Optional / None) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Home Address */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">6</span>
                        <span>Home Address</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Optional</span>
                    </label>
                    <select
                      value={mapping.homeAddress}
                      onChange={e => setMapping({ ...mapping, homeAddress: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (Optional / None) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Gender / Notes */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">7</span>
                        <span>Gender / Sex</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Default: Male</span>
                    </label>
                    <select
                      value={mapping.gender || ''}
                      onChange={e => setMapping({ ...mapping, gender: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- (Auto / Male) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-all"
                >
                  <span>Proceed to Review & Import ({rawRows.length} rows)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & IMPORT */}
          {step === 'preview' && (
            <div className="space-y-4">
              
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  onClick={() => setActiveTab('all')}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    activeTab === 'all'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Rows</div>
                  <div className="text-lg font-extrabold text-slate-800">{totalCount}</div>
                </div>

                <div
                  onClick={() => setActiveTab('complete')}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    activeTab === 'complete'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Complete Records</div>
                  <div className="text-lg font-extrabold text-emerald-800">{completeCount}</div>
                </div>

                <div
                  onClick={() => setActiveTab('incomplete')}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    activeTab === 'incomplete'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                      : 'border-slate-200 bg-amber-50/30 hover:bg-amber-50/60'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-amber-700">Incomplete (Ready)</div>
                  <div className="text-lg font-extrabold text-amber-800">{incompleteCount}</div>
                </div>

                <div
                  onClick={() => setActiveTab('duplicates')}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    activeTab === 'duplicates'
                      ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200'
                      : 'border-slate-200 bg-blue-50/30 hover:bg-blue-50/60'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-blue-700">Duplicates</div>
                  <div className="text-lg font-extrabold text-blue-800">{duplicateCount}</div>
                </div>
              </div>

              {/* Import Options Bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={importIncomplete}
                      onChange={e => setImportIncomplete(e.target.checked)}
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Import incomplete records with smart defaults</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={e => setSkipDuplicates(e.target.checked)}
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Skip duplicates ({duplicateCount})</span>
                  </label>
                </div>

                <span className="text-[11px] text-slate-500">
                  Target: <strong className="text-indigo-700">{activeBranch}</strong>
                </span>
              </div>

              {/* Success Notification */}
              {importSummary && (
                <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Spreadsheet Imported Successfully!</div>
                    <div>
                      Added <strong>{importSummary.totalImported}</strong> children to {activeBranch} ({importSummary.completeCount} complete, {importSummary.incompleteCount} incomplete with defaults applied).
                      {importSummary.duplicatesSkipped > 0 && ` ${importSummary.duplicatesSkipped} duplicates were skipped.`}
                    </div>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Upload Status</th>
                      <th className="py-2.5 px-3">Child Name</th>
                      <th className="py-2.5 px-3">Date of Birth</th>
                      <th className="py-2.5 px-3">Guardian Phone</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Home Address</th>
                      <th className="py-2.5 px-3">Defaults & Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map(r => {
                      const willBeImported = r.canImport && (importIncomplete || r.isComplete) && (!skipDuplicates || !r.isDuplicate);

                      return (
                        <tr
                          key={r.rowNumber}
                          className={
                            r.isEmpty
                              ? 'bg-slate-50/50 opacity-50'
                              : willBeImported
                                ? r.isComplete
                                  ? 'hover:bg-slate-50/50'
                                  : 'bg-amber-50/30 hover:bg-amber-50/50'
                                : 'bg-slate-100/50 text-slate-400'
                          }
                        >
                          <td className="py-2 px-3 font-mono text-slate-500">#{r.rowNumber}</td>
                          
                          <td className="py-2 px-3 whitespace-nowrap">
                            {r.isEmpty ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                                Blank Row
                              </span>
                            ) : r.isDuplicate ? (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                <span>Duplicate</span>
                              </span>
                            ) : r.isComplete ? (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                <span>Incomplete (Ready)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {r.parsedData.fullName}
                          </td>

                          <td className="py-2 px-3 font-mono">
                            {r.missingFields.includes('Date of Birth') ? (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md text-[10px] border border-amber-200">
                                {r.parsedData.dateOfBirth} (Default)
                              </span>
                            ) : (
                              <span>{r.parsedData.dateOfBirth}</span>
                            )}
                          </td>

                          <td className="py-2 px-3 font-mono text-slate-600">
                            {r.parsedData.guardians[0]?.phone || <span className="text-slate-400 italic">—</span>}
                          </td>

                          <td className="py-2 px-3 text-slate-600">
                            {r.parsedData.guardians[0]?.email || <span className="text-slate-400 italic">—</span>}
                          </td>

                          <td className="py-2 px-3 max-w-xs truncate text-slate-600">
                            {r.parsedData.homeAddress || <span className="text-slate-400 italic">—</span>}
                          </td>

                          <td className="py-2 px-3">
                            {r.isComplete ? (
                              <span className="text-emerald-700 text-[11px] font-semibold">100% Complete</span>
                            ) : (
                              <div className="space-y-0.5 text-[11px] text-amber-800">
                                {r.missingFields.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {r.missingFields.map((f, i) => (
                                      <span key={i} className="px-1.5 py-0.2 bg-amber-100/70 text-amber-900 rounded-sm text-[9px] font-medium">
                                        Missing {f}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Adjust Column Mapping
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  {completeCount > 0 && incompleteCount > 0 && (
                    <button
                      type="button"
                      disabled={!!importSummary}
                      onClick={() => handleCommitImport(true)}
                      className="px-4 py-2 border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                    >
                      Import Complete Only ({completeCount})
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={importableCount === 0 || !!importSummary}
                    onClick={() => handleCommitImport(false)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-40 transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import All ({importableCount} Records)</span>
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
