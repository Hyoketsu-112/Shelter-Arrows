import * as XLSX from 'xlsx';
import { Child, ChurchBranch, GuardianContact } from '../types';

export interface ColumnMapping {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  guardianPhone: string;
  guardianEmail: string;
  homeAddress: string;
  // Optional / fallback fields
  fullName?: string;
  gender?: string;
  notes?: string;
  guardianName?: string;
}

export interface ValidatedChildRow {
  rowNumber: number;
  originalRow: Record<string, any>;
  parsedData: {
    fullName: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female';
    homeAddress?: string;
    notes?: string;
    guardians: GuardianContact[];
  };
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

export interface ParseResult {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
}

// Automatic column matching against the church standard 6-column format
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const cand of candidates) {
      const match = headers.find(h => {
        const clean = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return clean === cand || clean.includes(cand);
      });
      if (match) return match;
    }
    return '';
  };

  return {
    // 1. First Name
    firstName: findMatch(['firstname', 'first', 'fname', 'childfirstname', 'childfirst']),
    // 2. Last Name
    lastName: findMatch(['lastname', 'last', 'surname', 'familyname', 'lname', 'childlastname']),
    // 3. Date of Birth
    dateOfBirth: findMatch(['dateofbirth', 'dob', 'birthdate', 'birthday', 'birth']),
    // 4. Guardian's phone number
    guardianPhone: findMatch([
      'guardiansphonenumber',
      'guardianphonenumber',
      'guardiansphone',
      'guardianphone',
      'parentphone',
      'phonenumber',
      'phone',
      'mobile'
    ]),
    // 5. Email
    guardianEmail: findMatch(['email', 'guardianemail', 'guardiansemail', 'parentemail', 'emailaddress']),
    // 6. Home Address
    homeAddress: findMatch(['homeaddress', 'address', 'residentialaddress', 'residence', 'streetaddress']),
    
    // Optional / auxiliary matches
    fullName: findMatch(['fullname', 'childname', 'name', 'child']),
    gender: findMatch(['gender', 'sex']),
    notes: findMatch(['notes', 'specialneeds', 'allergies', 'info', 'comment']),
    guardianName: findMatch(['guardianname', 'parentname', 'mothername', 'fathername'])
  };
}

// Parse uploaded file (CSV, .xlsx, .xls)
export async function parseFileToData(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  // Extract headers
  let headers: string[] = [];
  if (rawRows.length > 0) {
    headers = Object.keys(rawRows[0]);
  } else {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
      if (cell && cell.v) headers.push(String(cell.v));
    }
  }

  return {
    headers,
    rows: rawRows,
    fileName: file.name
  };
}

// Normalize and parse dates into YYYY-MM-DD
export function parseAndValidateDate(val: any): { dateString: string; error?: string } {
  if (!val) return { dateString: '', error: 'Date of Birth is required' };

  let d: Date | null = null;

  if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'number') {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      d = new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  } else if (typeof val === 'string') {
    const s = val.trim();
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
      const parts = s.split('-').map(Number);
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const parts = s.split('/').map(Number);
      if (parts[0] > 12) {
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        d = new Date(parts[2], parts[0] - 1, parts[1]);
      }
    } else {
      const parsed = Date.parse(s);
      if (!isNaN(parsed)) {
        d = new Date(parsed);
      }
    }
  }

  if (!d || isNaN(d.getTime())) {
    return { dateString: '', error: `Invalid date format: "${val}". Expected YYYY-MM-DD` };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (d.getTime() > today.getTime()) {
    return { dateString: '', error: `Birth date cannot be in the future (${d.toISOString().slice(0, 10)})` };
  }

  const hundredYearsAgo = new Date();
  hundredYearsAgo.setFullYear(today.getFullYear() - 25);
  if (d.getTime() < hundredYearsAgo.getTime()) {
    return { dateString: '', error: `Birth date indicates age over 25 years (${d.toISOString().slice(0, 10)})` };
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { dateString: `${y}-${m}-${day}` };
}

// Validate each row according to the 6 standard format columns
export function validateImportRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  existingChildren: Child[],
  targetBranch: ChurchBranch
): ValidatedChildRow[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];

    // 1 & 2. First Name and Last Name
    const firstName = mapping.firstName ? String(row[mapping.firstName] || '').trim() : '';
    const lastName = mapping.lastName ? String(row[mapping.lastName] || '').trim() : '';
    const rawFullName = mapping.fullName ? String(row[mapping.fullName] || '').trim() : '';

    let resolvedFullName = '';
    if (firstName && lastName) {
      resolvedFullName = `${firstName} ${lastName}`;
    } else if (firstName) {
      resolvedFullName = firstName;
    } else if (lastName) {
      resolvedFullName = lastName;
    } else if (rawFullName) {
      resolvedFullName = rawFullName;
    }

    if (!resolvedFullName) {
      errors.push('Missing child First Name or Last Name');
    }

    // 3. Date of Birth
    const rawDob = mapping.dateOfBirth ? row[mapping.dateOfBirth] : '';
    const dateResult = parseAndValidateDate(rawDob);
    if (dateResult.error) {
      errors.push(dateResult.error);
    }

    // 4. Guardian's Phone Number
    const guardianPhone = mapping.guardianPhone ? String(row[mapping.guardianPhone] || '').trim() : '';

    // 5. Email
    const guardianEmail = mapping.guardianEmail ? String(row[mapping.guardianEmail] || '').trim() : '';

    // 6. Home Address
    const homeAddress = mapping.homeAddress ? String(row[mapping.homeAddress] || '').trim() : '';

    // Optional Gender
    const rawGender = mapping.gender ? String(row[mapping.gender] || '').trim().toLowerCase() : '';
    let gender: 'Male' | 'Female' = 'Male';
    if (rawGender.startsWith('f') || rawGender === 'girl') {
      gender = 'Female';
    } else if (rawGender.startsWith('m') || rawGender === 'boy') {
      gender = 'Male';
    }

    // Optional Notes
    const notes = mapping.notes ? String(row[mapping.notes] || '').trim() : '';

    // Guardians Contact Object
    const guardians: GuardianContact[] = [];
    const guardianName = mapping.guardianName && row[mapping.guardianName]
      ? String(row[mapping.guardianName]).trim()
      : (lastName ? `Guardian (${lastName} Family)` : 'Parent/Guardian');

    if (guardianPhone || guardianEmail || guardianName) {
      guardians.push({
        id: `g-${Date.now()}-${index}`,
        name: guardianName,
        phone: guardianPhone,
        email: guardianEmail || undefined,
        relationship: 'Parent/Guardian'
      });
    }

    // Duplicate check
    const isDuplicate = existingChildren.some(c =>
      c.branch === targetBranch &&
      c.fullName.toLowerCase() === resolvedFullName.toLowerCase() &&
      c.dateOfBirth === dateResult.dateString
    );

    if (isDuplicate) {
      errors.push(`Duplicate: Child "${resolvedFullName}" with birth date ${dateResult.dateString} already exists in ${targetBranch}`);
    }

    const isValid = errors.length === 0;

    return {
      rowNumber,
      originalRow: row,
      parsedData: {
        fullName: resolvedFullName,
        firstName: firstName || resolvedFullName.split(' ')[0] || '',
        lastName: lastName || resolvedFullName.split(' ').slice(1).join(' ') || '',
        dateOfBirth: dateResult.dateString,
        gender,
        homeAddress: homeAddress || undefined,
        notes: notes || undefined,
        guardians
      },
      isValid,
      errors,
      isDuplicate
    };
  });
}

// Generate sample Excel template matching the 6 required columns exactly
export function downloadSampleSpreadsheet(format: 'xlsx' | 'csv') {
  const sampleData = [
    {
      'First Name': 'Samuel',
      'Last Name': 'Oladipo',
      'Date of Birth': '2019-05-14',
      "Guardian's phone number": '+234 802 345 6789',
      'Email': 'toyin.oladipo@example.com',
      'Home Address': '12 Okota Palace Road, Okota, Lagos'
    },
    {
      'First Name': 'Deborah',
      'Last Name': 'Chimamanda',
      'Date of Birth': '2021-08-22',
      "Guardian's phone number": '+234 809 112 2334',
      'Email': 'chukwuma.chima@example.com',
      'Home Address': '45 Community Road, Ago Palace Way, Lagos'
    },
    {
      'First Name': 'Joshua',
      'Last Name': 'Adeleke',
      'Date of Birth': '2017-03-10',
      "Guardian's phone number": '+234 807 555 4433',
      'Email': 'ronke.adeleke@example.com',
      'Home Address': '8 Anthony Village Road, Anthony, Lagos'
    },
    {
      'First Name': 'Miracle',
      'Last Name': 'Okonkwo',
      'Date of Birth': '2020-11-28',
      "Guardian's phone number": '+234 812 777 8899',
      'Email': 'blessing.okonkwo@example.com',
      'Home Address': '19 Church Street, Okota, Lagos'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Children Register');

  if (format === 'csv') {
    XLSX.writeFile(workbook, 'The_Shelter_Junior_Church_Children_Import.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, 'The_Shelter_Junior_Church_Children_Import.xlsx', { bookType: 'xlsx' });
  }
}

// Export Children to Excel with the standard columns
export function exportChildrenToExcel(children: Child[], branch: ChurchBranch) {
  const exportData = children.map(c => {
    const nameParts = c.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const firstGuardian = c.guardians?.[0];

    return {
      'First Name': firstName,
      'Last Name': lastName,
      'Full Name': c.fullName,
      'Date of Birth': c.dateOfBirth,
      "Guardian's phone number": firstGuardian?.phone || '',
      'Email': firstGuardian?.email || '',
      'Home Address': c.homeAddress || '',
      'Gender': c.gender,
      'Branch': c.branch,
      'Notes': c.notes || '',
      'Registration Date': c.createdAt ? c.createdAt.slice(0, 10) : ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${branch} Children`);
  XLSX.writeFile(workbook, `Shelter_JC_${branch.replace(/\s+/g, '_')}_Children_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
