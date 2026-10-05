import {
  Child,
  User,
  UserRole,
  ChurchBranch,
  AttendanceRecord,
  ActivityLogItem,
  BirthdayInfo,
  EmailDigestConfig,
  CHURCH_BRANCHES
} from '../types';

const STORAGE_KEYS = {
  USERS: 'shelter_jc_users_v2',
  CHILDREN: 'shelter_jc_children_v2',
  ATTENDANCE: 'shelter_jc_attendance_v2',
  ACTIVITY: 'shelter_jc_activity_v2',
  DIGEST: 'shelter_jc_digest_v2',
  CURRENT_USER: 'shelter_jc_current_user_v2',
  ACTIVE_BRANCH: 'shelter_jc_active_branch_v2',
};

// Helper: Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Initial seed data
const SEED_USERS: User[] = [
  {
    id: 'user-admin-1',
    fullName: 'Pastor David Olatunji',
    email: 'pastor.david@theshelter.org',
    role: 'global_admin',
    requestedRole: 'global_admin',
    primaryBranch: 'Shelter Okota',
    authorizedBranches: ['Shelter Okota', 'Community Church', 'Anthony Church'],
    status: 'approved',
    createdAt: '2025-01-10T09:00:00Z',
    approvedAt: '2025-01-10T09:00:00Z',
    phone: '+234 803 123 4567',
  },
  {
    id: 'user-global-admin-user',
    fullName: 'Senior Pastor / Global Admin',
    email: 'sd0021306@gmail.com',
    role: 'global_admin',
    requestedRole: 'global_admin',
    primaryBranch: 'Shelter Okota',
    authorizedBranches: ['Shelter Okota', 'Community Church', 'Anthony Church'],
    status: 'approved',
    createdAt: '2025-01-01T00:00:00Z',
    approvedAt: '2025-01-01T00:00:00Z',
    phone: '+234 800 123 9999',
  },
  {
    id: 'user-admin-2',
    fullName: 'Sister Grace Adebayo',
    email: 'sister.grace@theshelter.org',
    role: 'admin',
    requestedRole: 'admin',
    primaryBranch: 'Shelter Okota',
    authorizedBranches: ['Shelter Okota', 'Community Church'],
    status: 'approved',
    createdAt: '2025-02-01T10:00:00Z',
    approvedAt: '2025-02-01T10:30:00Z',
    approvedBy: 'user-admin-1',
    phone: '+234 802 987 6543',
  },
  {
    id: 'user-teacher-1',
    fullName: 'Teacher John Chukwu',
    email: 'teacher.john@theshelter.org',
    role: 'teacher',
    requestedRole: 'teacher',
    primaryBranch: 'Shelter Okota',
    authorizedBranches: ['Shelter Okota'],
    status: 'approved',
    createdAt: '2025-03-01T12:00:00Z',
    approvedAt: '2025-03-02T08:00:00Z',
    approvedBy: 'user-admin-1',
    phone: '+234 805 111 2233',
  },
  {
    id: 'user-teacher-2',
    fullName: 'Teacher Mary Johnson',
    email: 'teacher.mary@theshelter.org',
    role: 'teacher',
    requestedRole: 'teacher',
    primaryBranch: 'Community Church',
    authorizedBranches: ['Community Church'],
    status: 'approved',
    createdAt: '2025-03-05T14:00:00Z',
    approvedAt: '2025-03-06T09:00:00Z',
    approvedBy: 'user-admin-1',
    phone: '+234 807 444 5566',
  },
  {
    id: 'user-pending-1',
    fullName: 'Brother Samuel Eze',
    email: 'applicant.samuel@theshelter.org',
    role: 'teacher',
    requestedRole: 'teacher',
    primaryBranch: 'Anthony Church',
    authorizedBranches: ['Anthony Church'],
    status: 'pending',
    createdAt: '2026-10-02T15:20:00Z',
    phone: '+234 818 777 8899',
  }
];

const DEMO_USER_IDS = new Set(SEED_USERS.map(user => user.id));

function getSampleBirthday(daysOffset: number, birthYear: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${birthYear}-${m}-${day}`;
}

const SEED_CHILDREN: Child[] = [
  // Shelter Okota
  {
    id: 'child-1',
    fullName: 'Emmanuel David',
    dateOfBirth: getSampleBirthday(0, 2018), // Birthday TODAY!
    gender: 'Male',
    branch: 'Shelter Okota',
    notes: 'Likes drawing and singing. Very enthusiastic during praise time.',
    guardians: [
      {
        id: 'g-1',
        name: 'Mr. & Mrs. Michael David',
        relationship: 'Father',
        phone: '+234 802 345 6789',
        email: 'michael.david@example.com'
      },
      {
        id: 'g-2',
        name: 'Sarah David',
        relationship: 'Mother',
        phone: '+234 803 456 7890',
        email: 'sarah.david@example.com'
      }
    ],
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'child-2',
    fullName: 'Faithfulness Oluwaseun',
    dateOfBirth: getSampleBirthday(2, 2020), // Birthday in 2 days
    gender: 'Female',
    branch: 'Shelter Okota',
    notes: 'Mild peanut allergy. Please keep an eye during snack time.',
    guardians: [
      {
        id: 'g-3',
        name: 'Kemi Oluwaseun',
        relationship: 'Mother',
        phone: '+234 806 789 0123',
        email: 'kemi.oluwa@example.com'
      }
    ],
    createdAt: '2025-01-18T11:00:00Z'
  },
  {
    id: 'child-3',
    fullName: 'Daniel Kalu',
    dateOfBirth: getSampleBirthday(5, 2016), // Birthday in 5 days
    gender: 'Male',
    branch: 'Shelter Okota',
    notes: 'Junior bible quiz leader. Memorized Psalm 23.',
    guardians: [
      {
        id: 'g-4',
        name: 'Barrister Nnamdi Kalu',
        relationship: 'Father',
        phone: '+234 808 234 5678',
        email: 'nnamdi.kalu@lawfirm.ng'
      }
    ],
    createdAt: '2025-01-20T12:00:00Z'
  },
  {
    id: 'child-4',
    fullName: 'Joy Chimamanda',
    dateOfBirth: '2019-11-15',
    gender: 'Female',
    branch: 'Shelter Okota',
    notes: 'Loves memory verses recitation.',
    guardians: [
      {
        id: 'g-5',
        name: 'Chinyere Chimamanda',
        relationship: 'Mother',
        phone: '+234 809 333 4455',
        email: 'chinyere.chima@example.com'
      }
    ],
    createdAt: '2025-02-05T09:30:00Z'
  },
  {
    id: 'child-5',
    fullName: 'Praise Nwachukwu',
    dateOfBirth: '2022-04-20',
    gender: 'Female',
    branch: 'Shelter Okota',
    notes: 'Toddler class. Brings favorite teddy bear.',
    guardians: [
      {
        id: 'g-6',
        name: 'Emeka Nwachukwu',
        relationship: 'Father',
        phone: '+234 803 999 1122',
        email: 'emeka.nwa@example.com'
      }
    ],
    createdAt: '2025-02-12T14:15:00Z'
  },
  {
    id: 'child-6',
    fullName: 'Victor Adeyemi',
    dateOfBirth: '2015-08-10',
    gender: 'Male',
    branch: 'Shelter Okota',
    notes: 'Pre-teens group. Plays acoustic guitar.',
    guardians: [
      {
        id: 'g-7',
        name: 'Engr. Tunde Adeyemi',
        relationship: 'Father',
        phone: '+234 802 777 6655',
        email: 'tunde.adeyemi@construct.ng'
      }
    ],
    createdAt: '2025-02-15T16:00:00Z'
  },

  // Community Church
  {
    id: 'child-7',
    fullName: 'Miracle Chinedu',
    dateOfBirth: getSampleBirthday(1, 2017), // Birthday tomorrow
    gender: 'Female',
    branch: 'Community Church',
    notes: 'Very creative with art crafts.',
    guardians: [
      {
        id: 'g-8',
        name: 'Blessing Chinedu',
        relationship: 'Mother',
        phone: '+234 812 345 6789',
        email: 'blessing.chinedu@example.com'
      }
    ],
    createdAt: '2025-02-20T10:00:00Z'
  },
  {
    id: 'child-8',
    fullName: 'David Ayomide',
    dateOfBirth: getSampleBirthday(4, 2021), // Birthday in 4 days
    gender: 'Male',
    branch: 'Community Church',
    notes: 'Active and friendly with everyone.',
    guardians: [
      {
        id: 'g-9',
        name: 'Folake Ayomide',
        relationship: 'Mother',
        phone: '+234 813 456 7890',
        email: 'folake.ayo@example.com'
      }
    ],
    createdAt: '2025-03-01T11:00:00Z'
  },
  {
    id: 'child-9',
    fullName: 'Deborah Somtochukwu',
    dateOfBirth: '2018-06-18',
    gender: 'Female',
    branch: 'Community Church',
    notes: 'Enjoys scripture reading out loud.',
    guardians: [
      {
        id: 'g-10',
        name: 'Ifeanyi Somtochukwu',
        relationship: 'Father',
        phone: '+234 814 567 8901',
        email: 'ifeanyi.somto@example.com'
      }
    ],
    createdAt: '2025-03-05T09:00:00Z'
  },

  // Anthony Church
  {
    id: 'child-10',
    fullName: 'Gabriel Temitope',
    dateOfBirth: getSampleBirthday(0, 2019), // Birthday TODAY at Anthony Church!
    gender: 'Male',
    branch: 'Anthony Church',
    notes: 'Loves drama presentations.',
    guardians: [
      {
        id: 'g-11',
        name: 'Dr. Kunle Temitope',
        relationship: 'Father',
        phone: '+234 815 678 9012',
        email: 'kunle.temitope@clinic.ng'
      }
    ],
    createdAt: '2025-03-10T08:30:00Z'
  },
  {
    id: 'child-11',
    fullName: 'Precious Akpan',
    dateOfBirth: getSampleBirthday(6, 2022), // Birthday in 6 days
    gender: 'Female',
    branch: 'Anthony Church',
    notes: 'Gentle child. Speaks softly.',
    guardians: [
      {
        id: 'g-12',
        name: 'Aniefiok Akpan',
        relationship: 'Father',
        phone: '+234 816 789 0123',
        email: 'aniefiok.akpan@example.com'
      }
    ],
    createdAt: '2025-03-12T13:00:00Z'
  },
  {
    id: 'child-12',
    fullName: 'Samuel Babatunde',
    dateOfBirth: '2017-12-04',
    gender: 'Male',
    branch: 'Anthony Church',
    notes: 'Always assists teachers to arrange classroom chairs.',
    guardians: [
      {
        id: 'g-13',
        name: 'Ronke Babatunde',
        relationship: 'Mother',
        phone: '+234 817 890 1234',
        email: 'ronke.babatunde@example.com'
      }
    ],
    createdAt: '2025-03-14T10:15:00Z'
  }
];

const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    branch: 'Shelter Okota',
    date: '2026-09-27',
    serviceTopic: 'Walking in the Light - 1 John 1:7',
    recordedBy: {
      id: 'user-teacher-1',
      name: 'Teacher John Chukwu'
    },
    entries: [
      { childId: 'child-1', childName: 'Emmanuel David', status: 'present' },
      { childId: 'child-2', childName: 'Faithfulness Oluwaseun', status: 'present' },
      { childId: 'child-3', childName: 'Daniel Kalu', status: 'present' },
      { childId: 'child-4', childName: 'Joy Chimamanda', status: 'present' },
      { childId: 'child-5', childName: 'Praise Nwachukwu', status: 'excused', notes: 'Traveling with parents' },
      { childId: 'child-6', childName: 'Victor Adeyemi', status: 'absent' }
    ],
    createdAt: '2026-09-27T12:30:00Z'
  },
  {
    id: 'att-2',
    branch: 'Community Church',
    date: '2026-09-27',
    serviceTopic: 'The Good Samaritan - Luke 10',
    recordedBy: {
      id: 'user-teacher-2',
      name: 'Teacher Mary Johnson'
    },
    entries: [
      { childId: 'child-7', childName: 'Miracle Chinedu', status: 'present' },
      { childId: 'child-8', childName: 'David Ayomide', status: 'present' },
      { childId: 'child-9', childName: 'Deborah Somtochukwu', status: 'present' }
    ],
    createdAt: '2026-09-27T12:00:00Z'
  }
];

const SEED_ACTIVITY: ActivityLogItem[] = [
  {
    id: 'act-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    userName: 'Pastor David Olatunji',
    userRole: 'admin',
    branch: 'Shelter Okota',
    action: 'Child Profile Updated',
    details: 'Updated profile care notes and emergency contact for Faithfulness Oluwaseun',
    targetEntity: 'Faithfulness Oluwaseun',
    type: 'child',
    severity: 'info'
  },
  {
    id: 'act-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55 mins ago
    userName: 'Sister Grace Adebayo',
    userRole: 'admin',
    branch: 'Shelter Okota',
    action: 'Team Account Approved',
    details: 'Approved Teacher John Chukwu with authorized access to Shelter Okota',
    targetEntity: 'Teacher John Chukwu',
    type: 'team',
    severity: 'success'
  },
  {
    id: 'act-3',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    userName: 'Pastor David Olatunji',
    userRole: 'admin',
    branch: 'Community Church',
    action: 'Child Profile Deleted',
    details: 'Permanently deleted child record for Tobi Alabi following family relocation',
    targetEntity: 'Tobi Alabi',
    type: 'child',
    severity: 'danger'
  },
  {
    id: 'act-4',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    userName: 'Pastor David Olatunji',
    userRole: 'admin',
    branch: 'Shelter Okota',
    action: 'Attendance Saved',
    details: 'Attendance recorded for 6 children on Sunday Service roster (83% present)',
    targetEntity: 'Shelter Okota Service',
    type: 'attendance',
    severity: 'info'
  },
  {
    id: 'act-5',
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString(), // 14 hours ago
    userName: 'Sister Grace Adebayo',
    userRole: 'admin',
    branch: 'Community Church',
    action: 'Team Account Approved',
    details: 'Approved Teacher Mary Johnson with access to Community Church',
    targetEntity: 'Teacher Mary Johnson',
    type: 'team',
    severity: 'success'
  },
  {
    id: 'act-6',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    userName: 'Brother Samuel Eze',
    userRole: 'teacher',
    branch: 'Anthony Church',
    action: 'Account Request Submitted',
    details: 'Requested Teacher staff account for Anthony Church branch (Pending Review)',
    targetEntity: 'Brother Samuel Eze',
    type: 'auth',
    severity: 'warning'
  },
  {
    id: 'act-7',
    timestamp: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
    userName: 'Pastor David Olatunji',
    userRole: 'admin',
    branch: 'Anthony Church',
    action: 'Branch Access Modified',
    details: 'Updated authorized branch permissions for Sister Grace Adebayo',
    targetEntity: 'Sister Grace Adebayo',
    type: 'team',
    severity: 'info'
  },
  {
    id: 'act-8',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    userName: 'Pastor David Olatunji',
    userRole: 'admin',
    branch: 'Shelter Okota',
    action: 'Child Profile Registered',
    details: 'Registered new child Emmanuel David with 2 parent guardian contacts',
    targetEntity: 'Emmanuel David',
    type: 'child',
    severity: 'success'
  }
];

const SEED_DIGEST: EmailDigestConfig = {
  enabled: true,
  frequency: 'weekly',
  sendDayOfWeek: 1, // Monday
  sendTime: '08:00',
  provider: 'resend',
  recipientAdminEmails: [
    'pastor.david@theshelter.org',
    'sister.grace@theshelter.org'
  ]
};

// Storage Service Wrapper
export const StorageService = {
  // --- USERS & AUTH ---
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let list: User[];
    if (!raw) {
      list = [];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    // Remove bundled demo accounts so a new deployment can bootstrap its own admin.
    const filteredList = list.filter(user => !DEMO_USER_IDS.has(user.id));
    const modified = filteredList.length !== list.length;
    list = filteredList;

    if (modified) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    }
    return list;
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      // Refresh with latest from database
      const users = this.getUsers();
      const match = users.find(u => u.id === parsed.id);
      return match || null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  getRememberedEmail(): string {
    return localStorage.getItem('shelter_jc_remembered_email') || '';
  },

  setRememberedEmail(email: string | null): void {
    if (!email) {
      localStorage.removeItem('shelter_jc_remembered_email');
    } else {
      localStorage.setItem('shelter_jc_remembered_email', email);
    }
  },

  getActiveBranch(): ChurchBranch {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH) as ChurchBranch | null;
    if (saved && CHURCH_BRANCHES.includes(saved)) {
      return saved;
    }
    return 'Shelter Okota';
  },

  setActiveBranch(branch: ChurchBranch): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BRANCH, branch);
  },

  // Count approved branch admins (limit applies to local branch admins)
  getAdminCount(): number {
    const users = this.getUsers();
    return users.filter(u => u.role === 'admin' && u.status === 'approved').length;
  },

  // Count approved global admins
  getGlobalAdminCount(): number {
    const users = this.getUsers();
    return users.filter(u => u.role === 'global_admin' && u.status === 'approved').length;
  },

  canApproveAsAdmin(userId: string, roleToGrant: UserRole = 'admin'): { allowed: boolean; reason?: string } {
    if (roleToGrant === 'global_admin') {
      return { allowed: true };
    }
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { allowed: false, reason: 'User not found' };

    // If target is already approved admin, allowed
    if (target.role === 'admin' && target.status === 'approved') {
      return { allowed: true };
    }

    const currentAdmins = this.getAdminCount();
    if (currentAdmins >= 2) {
      return {
        allowed: false,
        reason: 'Maximum limit of 2 branch administrators reached. Global Admin or existing administrator must adjust roles before adding another branch admin.'
      };
    }
    return { allowed: true };
  },

  makeUserGlobalAdmin(userId: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'User not found.' };
    }

    const updatedUser: User = {
      ...target,
      role: 'global_admin',
      status: 'approved',
      approvedAt: target.approvedAt || new Date().toISOString(),
      authorizedBranches: ['Shelter Okota', 'Community Church', 'Anthony Church']
    };

    const updatedList = users.map(u => u.id === userId ? updatedUser : u);
    this.saveUsers(updatedList);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(updatedUser);
    }

    this.logActivity({
      userName: updatedUser.fullName,
      userRole: 'global_admin',
      branch: updatedUser.primaryBranch,
      action: 'Global Administrator Appointed',
      details: `${updatedUser.fullName} was appointed as Global Administrator with supreme access across all branches`,
      targetEntity: updatedUser.fullName,
      type: 'team',
      severity: 'warning'
    });

    return {
      success: true,
      message: `Successfully appointed ${updatedUser.fullName} as Global Administrator!`,
      user: updatedUser
    };
  },

  deleteUser(
    userId: string,
    actorId: string,
    actorName: string,
    actorRole: UserRole
  ): { success: boolean; message: string } {
    if (userId === actorId) {
      return { success: false, message: 'You cannot remove your own account while signed in.' };
    }

    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Staff member not found.' };
    }

    // Only Global Admins can delete another Global Admin
    if (target.role === 'global_admin') {
      if (actorRole !== 'global_admin') {
        return {
          success: false,
          message: 'Only a Global Administrator has permission to remove a Global Administrator.'
        };
      }
      const globalCount = users.filter(u => u.role === 'global_admin' && u.status === 'approved').length;
      if (globalCount <= 1) {
        return {
          success: false,
          message: 'Cannot remove the only remaining Global Administrator. The church must retain at least one Global Admin.'
        };
      }
    }

    // Protect last administrator if not global admin
    if (target.role === 'admin' && target.status === 'approved') {
      const adminCount = this.getAdminCount();
      const globalCount = this.getGlobalAdminCount();
      if (adminCount <= 1 && globalCount === 0) {
        return {
          success: false,
          message: 'Cannot remove the only remaining administrator. The church must have at least one active administrator.'
        };
      }
    }

    const filtered = users.filter(u => u.id !== userId);
    this.saveUsers(filtered);

    this.logActivity({
      userName: actorName,
      userRole: actorRole,
      branch: target.primaryBranch,
      action: 'Staff Account Removed',
      details: `Permanently removed staff member ${target.fullName} (${target.role}) from ${target.primaryBranch}`,
      targetEntity: target.fullName,
      type: 'team',
      severity: 'danger'
    });

    return { success: true, message: `Successfully removed ${target.fullName} from staff register.` };
  },

  deleteOwnAccount(userId: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Account not found.' };
    }

    // Safety check: protect if literally only 1 administrator exists total across church
    const totalRemainingAdmins = users.filter(
      u => (u.role === 'admin' || u.role === 'global_admin') && u.status === 'approved' && u.id !== userId
    ).length;

    if (totalRemainingAdmins < 1) {
      return {
        success: false,
        message: 'Cannot delete this account because it is the only administrator in the church system. Please appoint or approve another administrator before deleting this account.'
      };
    }

    // Mark as deleted to prevent auto-reseed
    try {
      const rawDeleted = localStorage.getItem('shelter_jc_deleted_users');
      const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!deletedList.includes(target.email.toLowerCase())) {
        deletedList.push(target.email.toLowerCase());
        localStorage.setItem('shelter_jc_deleted_users', JSON.stringify(deletedList));
      }
    } catch {
      // ignore
    }

    // Remove user
    const filtered = users.filter(u => u.id !== userId);
    this.saveUsers(filtered);

    // If remembered email was this user's email, clear it
    const remembered = this.getRememberedEmail();
    if (remembered.toLowerCase() === target.email.toLowerCase()) {
      this.setRememberedEmail(null);
    }

    // Clear current user from storage
    this.setCurrentUser(null);

    // Log the deletion activity
    this.logActivity({
      userName: target.fullName,
      userRole: target.role,
      branch: target.primaryBranch,
      action: 'Staff Account Deleted By Self',
      details: `${target.fullName} (${target.role}) permanently deleted their own account from ${target.primaryBranch}`,
      targetEntity: target.fullName,
      type: 'team',
      severity: 'danger'
    });

    return { success: true, message: 'Your account has been permanently deleted.' };
  },

  // --- CHILDREN ---
  getChildren(): Child[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHILDREN);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(SEED_CHILDREN));
      return SEED_CHILDREN;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_CHILDREN;
    }
  },

  saveChildren(children: Child[]): void {
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
  },

  addChild(childData: Omit<Child, 'id' | 'createdAt'>, actorName: string, actorRole: UserRole): Child {
    const children = this.getChildren();
    const newChild: Child = {
      ...childData,
      id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    children.unshift(newChild);
    this.saveChildren(children);

    this.logActivity({
      userName: actorName,
      userRole: actorRole,
      branch: newChild.branch,
      action: 'Child Profile Registered',
      details: `Registered new child profile for ${newChild.fullName} (${newChild.gender}, DOB: ${newChild.dateOfBirth})`,
      targetEntity: newChild.fullName,
      targetId: newChild.id,
      type: 'child',
      severity: 'success'
    });

    return newChild;
  },

  updateChild(child: Child, actorName: string, actorRole: 'admin' | 'teacher'): void {
    const children = this.getChildren();
    const index = children.findIndex(c => c.id === child.id);
    if (index !== -1) {
      children[index] = {
        ...child,
        updatedAt: new Date().toISOString()
      };
      this.saveChildren(children);
      this.logActivity({
        userName: actorName,
        userRole: actorRole,
        branch: child.branch,
        action: 'Child Profile Updated',
        details: `Updated child profile details for ${child.fullName} (Guardian & care notes updated)`,
        targetEntity: child.fullName,
        targetId: child.id,
        type: 'child',
        severity: 'info'
      });
    }
  },

  deleteChild(childId: string, actorName: string, actorRole: 'admin' | 'teacher'): boolean {
    const children = this.getChildren();
    const child = children.find(c => c.id === childId);
    if (!child) return false;

    const filtered = children.filter(c => c.id !== childId);
    this.saveChildren(filtered);

    this.logActivity({
      userName: actorName,
      userRole: actorRole,
      branch: child.branch,
      action: 'Child Profile Deleted',
      details: `Permanently deleted child profile for ${child.fullName} from ${child.branch} register`,
      targetEntity: child.fullName,
      targetId: childId,
      type: 'child',
      severity: 'danger'
    });
    return true;
  },

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(SEED_ATTENDANCE));
      return SEED_ATTENDANCE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_ATTENDANCE;
    }
  },

  saveAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt'>): AttendanceRecord {
    const all = this.getAttendance();
    // Check if record exists for same branch and date, replace or add
    const existingIndex = all.findIndex(a => a.branch === record.branch && a.date === record.date);
    const newRecord: AttendanceRecord = {
      ...record,
      id: existingIndex >= 0 ? all[existingIndex].id : `att-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      all[existingIndex] = newRecord;
    } else {
      all.unshift(newRecord);
    }

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));

    const presentCount = record.entries.filter(e => e.status === 'present').length;
    this.logActivity({
      userName: record.recordedBy.name,
      userRole: 'teacher',
      branch: record.branch,
      action: 'Attendance Saved',
      details: `Date: ${record.date} (${presentCount}/${record.entries.length} present)`,
      type: 'attendance'
    });

    return newRecord;
  },

  // --- ACTIVITY LOGS ---
  getActivity(): ActivityLogItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(SEED_ACTIVITY));
      return SEED_ACTIVITY;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_ACTIVITY;
    }
  },

  logActivity(item: Omit<ActivityLogItem, 'id' | 'timestamp'>): void {
    const all = this.getActivity();
    const newLog: ActivityLogItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    all.unshift(newLog);
    // keep last 200
    if (all.length > 200) all.length = 200;
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(all));
  },

  clearActivityLogs(): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify([]));
  },

  // --- EMAIL DIGEST CONFIG ---
  getDigestConfig(): EmailDigestConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.DIGEST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DIGEST, JSON.stringify(SEED_DIGEST));
      return SEED_DIGEST;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_DIGEST;
    }
  },

  saveDigestConfig(config: EmailDigestConfig): void {
    localStorage.setItem(STORAGE_KEYS.DIGEST, JSON.stringify(config));
  },

  // Reset sample data to default
  resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(SEED_CHILDREN));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(SEED_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(SEED_ACTIVITY));
    localStorage.setItem(STORAGE_KEYS.DIGEST, JSON.stringify(SEED_DIGEST));
  }
};

// --- AGE & BIRTHDAY CALCULATIONS ---

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function formatAgeString(birthDateString: string): string {
  if (!birthDateString) return 'Unknown';
  const today = new Date();
  const birthDate = new Date(birthDateString);

  const yearsDiff = today.getFullYear() - birthDate.getFullYear();
  const monthsDiff = today.getMonth() - birthDate.getMonth();
  const daysDiff = today.getDate() - birthDate.getDate();

  let totalMonths = yearsDiff * 12 + monthsDiff;
  if (daysDiff < 0) totalMonths--;

  if (totalMonths < 0) return 'Just born';
  if (totalMonths < 12) {
    return totalMonths === 1 ? '1 month old' : `${totalMonths} months old`;
  }
  const age = calculateAge(birthDateString);
  return age === 1 ? '1 year old' : `${age} years old`;
}

export function getBirthdayInfo(child: Child): BirthdayInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dob = new Date(child.dateOfBirth);
  const birthMonth = dob.getMonth();
  const birthDay = dob.getDate();

  const currentAge = calculateAge(child.dateOfBirth);

  // Next birthday this year or next year
  let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
  nextBirthday.setHours(0, 0, 0, 0);

  if (nextBirthday.getTime() < today.getTime()) {
    nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
  }

  const diffTime = nextBirthday.getTime() - today.getTime();
  const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isToday = daysUntil === 0;
  const isWithin7Days = daysUntil >= 0 && daysUntil <= 7;
  const ageNext = isToday ? currentAge : currentAge + 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    child,
    ageCurrent: currentAge,
    ageNext,
    birthDateFormatted: `${monthNames[birthMonth]} ${birthDay}`,
    daysUntilBirthday: daysUntil,
    isToday,
    isWithin7Days,
    nextBirthdayDate: nextBirthday
  };
}
