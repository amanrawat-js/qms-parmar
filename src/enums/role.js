export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  REVIEWER: 'REVIEWER',
  CONTENT_WRITER: 'CONTENT_WRITER',
  USER: 'USER',
};

export const ROLE_PERMISSIONS = {
  SUPERADMIN: [
    'CAN_MANAGE_SUPERADMINS',
    'CAN_VIEW_DASHBOARD',
    'CAN_MANAGE_USERS',
    'CAN_UPDATE_USERS',
    'CAN_MANAGE_BOARDS',
    'CAN_MANAGE_SHIFTS',
    'CAN_MANAGE_SUBJECTS',
    'CAN_MANAGE_REVIEWER_PERMISSIONS',
    'CAN_MANAGE_WRITER_PERMISSIONS',
  ],
  ADMIN: [
    'CAN_VIEW_DASHBOARD',
    'CAN_MANAGE_USERS',
    'CAN_MANAGE_BOARDS',
    'CAN_MANAGE_SHIFTS',
    'CAN_MANAGE_SUBJECTS',
    'CAN_MANAGE_REVIEWER_PERMISSIONS',
    'CAN_MANAGE_WRITER_PERMISSIONS',
  ],
  REVIEWER: [
    'CAN_VIEW_DASHBOARD',
    'CAN_REVIEW_QUESTIONS',
  ],
  CONTENT_WRITER: [
    'CAN_VIEW_DASHBOARD',
    'CAN_EDIT_QUESTIONS',
    'CAN_MANAGE_QUESTIONS',
  ],
  USER: [],
};

// ── Admin-only roles shorthand ──
const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN'];

// ── Dashboard page → allowed roles ──
// Keys are path prefixes checked with startsWith().
// Order matters: more specific routes should come first.
export const PAGE_ACCESS = [
  { path: '/dashboard/users',       roles: ADMIN_ROLES },
  { path: '/dashboard/boards',      roles: ADMIN_ROLES },
  { path: '/dashboard/exams',       roles: ADMIN_ROLES },
  { path: '/dashboard/subjects',    roles: ADMIN_ROLES },
  { path: '/dashboard/topics',      roles: ADMIN_ROLES },
  { path: '/dashboard/shifts',      roles: ADMIN_ROLES },
  { path: '/dashboard/editor',      roles: ADMIN_ROLES },
  { path: '/dashboard/questions',   roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  { path: '/dashboard/collections', roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  { path: '/dashboard/review',      roles: ['REVIEWER'] },
  { path: '/dashboard/writer',      roles: ['CONTENT_WRITER'] },
  { path: '/dashboard/profile',     roles: [...ADMIN_ROLES, 'REVIEWER', 'CONTENT_WRITER'] },
  // The dashboard home page is accessible to all authenticated roles with CAN_VIEW_DASHBOARD
  { path: '/dashboard',             roles: [...ADMIN_ROLES, 'REVIEWER', 'CONTENT_WRITER'] },
];

// ── API route → allowed roles (per HTTP method) ──
// 'ALL' means the method check applies to every HTTP method.
// IMPORTANT: More specific paths MUST come before broader ones (e.g., /api/users/profile before /api/users).
export const API_ACCESS = [
  // Profile — any authenticated user (MUST be before /api/users)
  { path: '/api/users/profile',       method: 'ALL',  roles: [...ADMIN_ROLES, 'REVIEWER', 'CONTENT_WRITER'] },
  // Users — admin only
  { path: '/api/users',               method: 'ALL',  roles: ADMIN_ROLES },
  // Boards — Content Writers need read access for question filter dropdowns
  { path: '/api/boards',              method: 'GET',  roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  { path: '/api/boards',              method: 'POST', roles: ADMIN_ROLES },
  { path: '/api/boards',              method: 'PUT',  roles: ADMIN_ROLES },
  { path: '/api/boards',              method: 'DELETE', roles: ADMIN_ROLES },
  // Exams  — Content Writers need read access for question filter dropdowns
  { path: '/api/exams',               method: 'GET',  roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  { path: '/api/exams',               method: 'POST', roles: ADMIN_ROLES },
  { path: '/api/exams',               method: 'PUT',  roles: ADMIN_ROLES },
  { path: '/api/exams',               method: 'DELETE', roles: ADMIN_ROLES },
  // Subjects — Content Writers need read access for question filter dropdowns
  { path: '/api/subjects',            method: 'GET',  roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  { path: '/api/subjects',            method: 'POST', roles: ADMIN_ROLES },
  { path: '/api/subjects',            method: 'PUT',  roles: ADMIN_ROLES },
  { path: '/api/subjects',            method: 'DELETE', roles: ADMIN_ROLES },
  // Topics — Content Writers need read access for question create page
  { path: '/api/topics',              method: 'GET',  roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  { path: '/api/topics',              method: 'POST', roles: ADMIN_ROLES },
  { path: '/api/topics',              method: 'PUT',  roles: ADMIN_ROLES },
  { path: '/api/topics',              method: 'DELETE', roles: ADMIN_ROLES },
  // Shifts — Content Writers need read access for question filters
  { path: '/api/shifts',              method: 'GET',  roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  { path: '/api/shifts',              method: 'POST', roles: ADMIN_ROLES },
  { path: '/api/shifts',              method: 'PUT',  roles: ADMIN_ROLES },
  { path: '/api/shifts',              method: 'DELETE', roles: ADMIN_ROLES },
  // Questions — Content Writers have full access
  { path: '/api/questions',           method: 'ALL',  roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  // Collections — Content Writers have full access
  { path: '/api/collections',         method: 'ALL',  roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
  // Question Reviews — Reviewers, Writers, and Admins
  { path: '/api/question-reviews',    method: 'ALL',  roles: [...ADMIN_ROLES, 'REVIEWER', 'CONTENT_WRITER'] },
  // Permissions (GET is open to auth users; PUT is already guarded in the route itself)
  { path: '/api/reviewer-permissions', method: 'ALL', roles: [...ADMIN_ROLES, 'REVIEWER', 'CONTENT_WRITER'] },
  { path: '/api/writer-permissions',   method: 'ALL', roles: [...ADMIN_ROLES, 'REVIEWER', 'CONTENT_WRITER'] },
  // Dashboard stats — role-aware response already in route
  { path: '/api/dashboard',           method: 'ALL',  roles: [...ADMIN_ROLES, 'REVIEWER', 'CONTENT_WRITER'] },
  // File upload — CKEditor image uploads to Vultr
  { path: '/api/upload',              method: 'POST', roles: [...ADMIN_ROLES, 'CONTENT_WRITER'] },
];