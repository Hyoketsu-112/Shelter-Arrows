export type ChurchBranch = 'Shelter Okota' | 'Community Church' | 'Anthony Church';

export const CHURCH_BRANCHES: ChurchBranch[] = [
  'Shelter Okota',
  'Community Church',
  'Anthony Church'
];

export type UserRole = 'admin' | 'teacher';

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  requestedRole: UserRole;
  primaryBranch: ChurchBranch;
  authorizedBranches: ChurchBranch[];
  status: AccountStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  phone?: string;
}

export interface GuardianContact {
  id: string;
  name: string;
  relationship: string; // e.g. Mother, Father, Guardian, Uncle
  phone: string;
  email?: string;
}

export interface Child {
  id: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'Male' | 'Female';
  branch: ChurchBranch;
  homeAddress?: string;
  notes?: string;
  guardians: GuardianContact[];
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface AttendanceEntry {
  childId: string;
  childName: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  branch: ChurchBranch;
  date: string; // YYYY-MM-DD
  serviceTopic?: string;
  recordedBy: {
    id: string;
    name: string;
  };
  entries: AttendanceEntry[];
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  branch: ChurchBranch;
  action: string;
  details: string;
  type: 'child' | 'attendance' | 'team' | 'auth' | 'system';
  targetEntity?: string;
  targetId?: string;
  severity?: 'info' | 'warning' | 'success' | 'danger';
}

export interface BirthdayInfo {
  child: Child;
  ageCurrent: number;
  ageNext: number;
  birthDateFormatted: string;
  daysUntilBirthday: number;
  isToday: boolean;
  isWithin7Days: boolean;
  nextBirthdayDate: Date;
}

export interface EmailDigestConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  sendDayOfWeek: number; // 1 = Monday
  sendTime: string; // "08:00"
  provider: 'resend' | 'supabase';
  recipientAdminEmails: string[];
  lastSent?: string;
}
