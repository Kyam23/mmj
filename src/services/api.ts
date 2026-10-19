/**
 * SMART GARBAGE MONITORING SYSTEM - API CLIENT
 * Connects to REST endpoints with Authorization Bearer token
 */

import {
  User,
  Purok,
  Household,
  CollectionSchedule,
  DisposalSubmission,
  PaymentSubmission,
  EndorsementRequest,
  Announcement,
  NotificationItem,
  ActivityLog,
  DashboardStats
} from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('bb_auth_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('bb_auth_token', token);
  } else {
    localStorage.removeItem('bb_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred during API request.';
    try {
      const data = await response.json();
      if (data && data.error) errorMsg = data.error;
    } catch {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; database_mode: string; metrics: any }>('/health'),

  // Auth
  login: (identifier: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),

  register: (payload: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    contact_number: string;
    purok_id: string;
    address_details?: string;
    family_member_count?: number;
  }) =>
    request<{
      require_verification?: boolean;
      user_id?: string;
      email?: string;
      demo_code?: string;
      message?: string;
      token?: string;
      user?: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  verifyEmail: (payload: { user_id?: string; email?: string; code: string }) =>
    request<{ token: string; user: User; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  resendVerificationCode: (payload: { user_id?: string; email?: string }) =>
    request<{ success: boolean; demo_code: string; message: string }>('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  forgotPassword: (identifier: string) =>
    request<{ success: boolean; email: string; demo_code: string; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    }),

  resetPassword: (payload: { email: string; code: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () => request<User>('/auth/me'),

  // Puroks & Households
  getPuroks: () => request<Purok[]>('/puroks'),
  getHouseholds: (purokId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (purokId) params.append('purok_id', purokId);
    if (search) params.append('search', search);
    return request<Household[]>(`/households?${params.toString()}`);
  },
  createHousehold: (payload: {
    head_name: string;
    purok_id: string;
    contact_number?: string;
    address_details?: string;
    family_member_count?: number;
  }) =>
    request<Household>('/households', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Users
  getUsers: (role?: string, purokId?: string) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (purokId) params.append('purok_id', purokId);
    return request<User[]>(`/users?${params.toString()}`);
  },
  createUser: (payload: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    role: string;
    purok_id?: string;
    contact_number?: string;
  }) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateUser: (id: string, payload: Partial<User> & { new_password?: string }) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Schedules
  getSchedules: (params?: { purok_id?: string; status?: string; collector_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.purok_id) q.append('purok_id', params.purok_id);
    if (params?.status) q.append('status', params.status);
    if (params?.collector_id) q.append('collector_id', params.collector_id);
    return request<CollectionSchedule[]>(`/schedules?${q.toString()}`);
  },
  createSchedule: (payload: {
    purok_id: string;
    collector_id: string;
    scheduled_date: string;
    time_slot: string;
    waste_type: string;
    notes?: string;
  }) =>
    request<CollectionSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateSchedule: (id: string, payload: Partial<CollectionSchedule>) =>
    request<CollectionSchedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteSchedule: (id: string) =>
    request<{ success: boolean; message: string }>(`/schedules/${id}`, {
      method: 'DELETE'
    }),

  // Collector Operations
  startCollection: (payload: { schedule_id: string; truck_number?: string; notes?: string }) =>
    request<{ schedule: CollectionSchedule; record: any }>('/collections/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateCollectionProgress: (payload: {
    schedule_id: string;
    collected_volume_kg?: number;
    collector_notes?: string;
  }) =>
    request<any>('/collections/update-progress', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  completeCollection: (payload: {
    schedule_id: string;
    collected_volume_kg?: number;
    collector_notes?: string;
  }) =>
    request<{ schedule: CollectionSchedule; record: any }>('/collections/complete', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Disposal Submissions & Leader Verification
  submitDisposal: (payload: {
    schedule_id: string;
    waste_type?: string;
    bag_count?: number;
    notes?: string;
    proof_url?: string;
  }) =>
    request<{ submission: DisposalSubmission; verification: any }>('/disposal/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getDisposalSubmissions: () => request<DisposalSubmission[]>('/disposal/submissions'),
  verifyDisposal: (payload: { submission_id: string; status: 'Verified' | 'Rejected'; remarks?: string }) =>
    request<any>('/disposal/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Payment Submissions & Leader Verification
  submitPayment: (payload: {
    period_start: string;
    period_end: string;
    amount: number;
    payment_method: string;
    reference_number: string;
    proof_url?: string;
  }) =>
    request<PaymentSubmission>('/payments/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getPayments: () => request<PaymentSubmission[]>('/payments'),
  verifyPayment: (payload: { payment_id: string; status: 'Verified' | 'Rejected'; rejection_reason?: string }) =>
    request<PaymentSubmission>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Endorsements (Purok Leader Final Approver!)
  requestEndorsement: (payload: { purpose: string; details?: string }) =>
    request<EndorsementRequest>('/endorsements/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getEndorsements: () => request<EndorsementRequest[]>('/endorsements'),
  reviewEndorsement: (payload: { endorsement_id: string; status: 'Approved' | 'Rejected'; remarks?: string }) =>
    request<EndorsementRequest>('/endorsements/review', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Announcements & Notifications
  getAnnouncements: () => request<Announcement[]>('/announcements'),
  createAnnouncement: (payload: {
    title: string;
    content: string;
    category?: string;
    priority?: string;
  }) =>
    request<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  deleteAnnouncement: (id: string) =>
    request<{ success: boolean }>(`/announcements/${id}`, {
      method: 'DELETE'
    }),
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'POST'
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST'
    }),

  // Activity logs & System Settings
  getActivityLogs: () => request<ActivityLog[]>('/activity-logs'),
  getSettings: () => request<Record<string, string>>('/settings'),
  updateSettings: (payload: Record<string, string>) =>
    request<{ success: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Reports
  getDashboardStats: () => request<DashboardStats>('/reports/dashboard-stats'),
  getExportUrl: (type: 'collections' | 'payments' | 'households' | 'endorsements') =>
    `${API_BASE}/reports/export-csv?type=${type}`
};
