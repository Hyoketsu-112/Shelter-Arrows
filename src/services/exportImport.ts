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
  isValid: boolean; // True if can be imported (both complete and incomplete non-empty rows)
  isComplete: boolean; // True if all 6 standard fields are present
  canImport: boolean; // True for all non-empty rows
  isEmpty: boolean; // True only if row has no data at all
  missingFields: string[]; // List of fields that were missing and filled with defaults
  warnings: string[]; // Explanatory notes for defaults applied
  errors: string[]; // Critical fatal issues (only empty rows)
  isDuplicate: boolean;
}

export interface ParseResult {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
}

// Automatic column matching against wide variations of church formats
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
    firstName: findMatch([
      'firstname',
      'first',
      'fname',
      'childfirstname',
      'childfirst',
      'givenname',
      'christianname',
      'forename'
    ]),
    // 2. Last Name
    lastName: findMatch([
      'lastname',
      'last',
      'surname',
      'familyname',
      'lname',
      'childlastname',
      'childsurname'
    ]),
    // 3. Date of Birth
    dateOfBirth: findMatch([
      'dateofbirth',
      'dob',
      'birthdate',
      'birthday',
      'birth',
      'born',
      'age',
      'yearofbirth',
      'yob'
    ]),
    // 4. Guardian's phone number
    guardianPhone: findMatch([
      'guardiansphonenumber',
      'guardianphonenumber',
      'guardiansphone',
      'guardianphone',
      'parentphone',
      'phonenumber',
      'phone',
      'mobile',
      'tel',
      'telephone',
      'contact',
      'cell',
      'gsm',
      'parentcontact',
      'emergencyphone'
    ]),
    // 5. Email
    guardianEmail: findMatch([
      'email',
      'guardianemail',
      'guardiansemail',
      'parentemail',
      'emailaddress',
      'parentmail',
      'mail'
    ]),
    // 6. Home Address
    homeAddress: findMatch([
      'homeaddress',
      'address',
      'residentialaddress',
      'residence',
      'streetaddress',
      'location',
      'houseaddress'
    ]),
    
    // Optional / auxiliary matches
    fullName: findMatch([
      'fullname',
      'childname',
      'name',
      'child',
      'names',
      'pupil',
      'member',
      'student',
      'kid'
    ]),
    gender: findMatch(['gender', 'sex', 'boyorgirl', 'morf']),
    notes: findMatch(['notes', 'specialneeds', 'allergies', 'info', 'comment', 'comments', 'remarks', 'class', 'grade']),
    guardianName: findMatch(['guardianname', 'parentname', 'mothername', 'fathername', 'parents', 'guardian', 'parent'])
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
// If missing, unparseable, or incomplete, gracefully supplies a fallback date so the file can be uploaded!
export function parseAndValidateDate(val: any, defaultYear = 2018): {
  dateString: string;
  isDefaulted: boolean;
  warning?: string;
} {
  if (!val || String(val).trim() === '') {
    return {
      dateString: `${defaultYear}-01-01`,
      isDefaulted: true,
      warning: 'Date of Birth not provided in file (defaulted to 2018-01-01)'
    };
  }

  let d: Date | null = null;

  if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'number') {
    // If user provided a 4-digit year like 2016
    if (val >= 1990 && val <= 2030) {
      d = new Date(val, 0, 1);
    } else {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        d = new Date(parsed.y, parsed.m - 1, parsed.d);
      }
    }
  } else if (typeof val === 'string') {
    const s = val.trim();

    // Handle age notation like "7", "7 yrs", "8 years old"
    const ageMatch = s.match(/^(\d{1,2})\s*(?:yrs|years|yr|y\.?o\.?)?$/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1], 10);
      if (age >= 0 && age <= 25) {
        const estYear = new Date().getFullYear() - age;
        return {
          dateString: `${estYear}-01-01`,
          isDefaulted: false,
          warning: `Inferred birth year ${estYear} from age "${s}"`
        };
      }
    }

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
    } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
      const parts = s.split('-').map(Number);
      d = new Date(parts[2], parts[1] - 1, parts[0]);
    } else if (/^\d{4}$/.test(s)) {
      const y = parseInt(s, 10);
      if (y >= 1990 && y <= new Date().getFullYear()) {
        return {
          dateString: `${y}-01-01`,
          isDefaulted: false,
          warning: `Birth year ${y} provided without specific day`
        };
      }
    } else {
      const parsed = Date.parse(s);
      if (!isNaN(parsed)) {
        d = new Date(parsed);
      }
    }
  }

  if (!d || isNaN(d.getTime())) {
    return {
      dateString: `${defaultYear}-01-01`,
      isDefaulted: true,
      warning: `Unrecognized date format "${val}" (defaulted to ${defaultYear}-01-01)`
    };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (d.getTime() > today.getTime()) {
    return {
      dateString: `${defaultYear}-01-01`,
      isDefaulted: true,
      warning: `Future birth date (${d.toISOString().slice(0, 10)}) adjusted to ${defaultYear}-01-01`
    };
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { dateString: `${y}-${m}-${day}`, isDefaulted: false };
}

// Validate each row - allows files to be uploaded whether complete or incomplete!
export function validateImportRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  existingChildren: Child[],
  targetBranch: ChurchBranch
): ValidatedChildRow[] {
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const missingFields: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if entire row is blank
    const rowValues = Object.values(row).map(v => String(v ?? '').trim()).filter(Boolean);
    const isEmpty = rowValues.length === 0;

    if (isEmpty) {
      errors.push('Empty row in spreadsheet');
      return {
        rowNumber,
        originalRow: row,
        parsedData: {
          fullName: `Empty Row #${rowNumber}`,
          firstName: '',
          lastName: '',
          dateOfBirth: '2018-01-01',
          gender: 'Male',
          guardians: []
        },
        isValid: false,
        isComplete: false,
        canImport: false,
        isEmpty: true,
        missingFields: ['All fields'],
        warnings: [],
        errors,
        isDuplicate: false
      };
    }

    // 1 & 2. First Name and Last Name
    let firstName = mapping.firstName ? String(row[mapping.firstName] || '').trim() : '';
    let lastName = mapping.lastName ? String(row[mapping.lastName] || '').trim() : '';
    const rawFullName = mapping.fullName ? String(row[mapping.fullName] || '').trim() : '';

    let resolvedFullName = '';
    if (firstName && lastName) {
      resolvedFullName = `${firstName} ${lastName}`;
    } else if (rawFullName) {
      resolvedFullName = rawFullName;
      const parts = rawFullName.split(/\s+/);
      if (!firstName && parts[0]) firstName = parts[0];
      if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
    } else if (firstName) {
      resolvedFullName = firstName;
      missingFields.push('Last Name');
      warnings.push('Last name missing; only first name recorded');
    } else if (lastName) {
      resolvedFullName = lastName;
      missingFields.push('First Name');
      warnings.push('First name missing; recorded under surname');
    } else {
      // Look for any string value in the row to use as name
      const possibleName = rowValues.find(v => v.length >= 2 && !/^\+?\d+$/.test(v) && !v.includes('@'));
      if (possibleName) {
        resolvedFullName = possibleName;
        firstName = possibleName.split(/\s+/)[0] || possibleName;
        lastName = possibleName.split(/\s+/).slice(1).join(' ');
        warnings.push(`Inferred name "${resolvedFullName}" from available row data`);
      } else {
        resolvedFullName = `Child #${rowNumber}`;
        firstName = `Child`;
        lastName = `#${rowNumber}`;
        missingFields.push('Child Name');
        warnings.push(`No name found in row; temporary placeholder assigned: Child #${rowNumber}`);
      }
    }

    // 3. Date of Birth (Flexible: never rejects, supplies safe default if incomplete)
    const rawDob = mapping.dateOfBirth ? row[mapping.dateOfBirth] : '';
    const dateResult = parseAndValidateDate(rawDob);
    if (dateResult.isDefaulted) {
      missingFields.push('Date of Birth');
    }
    if (dateResult.warning) {
      warnings.push(dateResult.warning);
    }

    // 4. Guardian's Phone Number
    const guardianPhone = mapping.guardianPhone ? String(row[mapping.guardianPhone] || '').trim() : '';
    if (!guardianPhone) {
      missingFields.push("Guardian Phone");
    }

    // 5. Email
    const guardianEmail = mapping.guardianEmail ? String(row[mapping.guardianEmail] || '').trim() : '';
    if (!guardianEmail) {
      missingFields.push('Email');
    }

    // 6. Home Address
    const homeAddress = mapping.homeAddress ? String(row[mapping.homeAddress] || '').trim() : '';
    if (!homeAddress) {
      missingFields.push('Home Address');
    }

    // Gender (Default to Male if not specified)
    const rawGender = mapping.gender ? String(row[mapping.gender] || '').trim().toLowerCase() : '';
    let gender: 'Male' | 'Female' = 'Male';
    if (rawGender.startsWith('f') || rawGender === 'girl' || rawGender === 'female') {
      gender = 'Female';
    } else if (rawGender.startsWith('m') || rawGender === 'boy' || rawGender === 'male') {
      gender = 'Male';
    } else if (rawGender) {
      warnings.push(`Unrecognized gender "${rawGender}"; defaulted to Male`);
    }

    // Notes
    const notes = mapping.notes ? String(row[mapping.notes] || '').trim() : '';

    // Guardians Contact Object
    const guardians: GuardianContact[] = [];
    const rawGuardianName = mapping.guardianName && row[mapping.guardianName]
      ? String(row[mapping.guardianName]).trim()
      : '';
    const fallbackGuardianName = rawGuardianName || (lastName ? `${lastName} Family` : 'Parent / Guardian');

    guardians.push({
      id: `g-${Date.now()}-${index}`,
      name: fallbackGuardianName,
      phone: guardianPhone || '',
      email: guardianEmail || undefined,
      relationship: 'Parent/Guardian'
    });

    // Duplicate check
    const isDuplicate = existingChildren.some(c =>
      c.branch === targetBranch &&
      c.fullName.trim().toLowerCase() === resolvedFullName.trim().toLowerCase()
    );

    if (isDuplicate) {
      warnings.push(`Duplicate: "${resolvedFullName}" is already registered in ${targetBranch}`);
    }

    const isComplete = missingFields.length === 0;
    const canImport = !isEmpty;
    const isValid = canImport; // Allow import whether complete or incomplete!

    return {
      rowNumber,
      originalRow: row,
      parsedData: {
        fullName: resolvedFullName,
        firstName: firstName || resolvedFullName,
        lastName: lastName || '',
        dateOfBirth: dateResult.dateString,
        gender,
        homeAddress: homeAddress || undefined,
        notes: notes || undefined,
        guardians
      },
      isValid,
      isComplete,
      canImport,
      isEmpty,
      missingFields,
      warnings,
      errors,
      isDuplicate
    };
  });
}

// Generate sample Excel template matching the 6 standard columns
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
