/**
 * TypeScript Interfaces for Barangay Bang-Bang Smart Garbage Monitoring System
 */

export type UserRole = 'admin' | 'collector' | 'leader' | 'resident';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  purok_id: string | null;
  purok_name?: string | null;
  household_id: string | null;
  household_number?: string | null;
  address_details?: string | null;
  contact_number: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

export interface Purok {
  id: string;
  name: string;
  description: string;
  target_collection_days: string;
  leader_id: string | null;
  leader_name?: string;
  leader_contact?: string;
  households_count?: number;
  residents_count?: number;
}

export interface Household {
  id: string;
  household_number: string;
  purok_id: string;
  purok_name?: string;
  head_name: string;
  contact_number: string;
  address_details: string;
  family_member_count: number;
  waste_segregation_compliant: boolean;
  registered_residents_count?: number;
  created_at: string;
}

export type WasteType = 'Biodegradable' | 'Non-Biodegradable' | 'Recyclable' | 'Special Waste';
export type ScheduleStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface CollectionSchedule {
  id: string;
  purok_id: string;
  purok_name: string;
  collector_id: string;
  collector_name: string;
  collector_contact?: string;
  scheduled_date: string;
  time_slot: string;
  waste_type: WasteType;
  status: ScheduleStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  execution_record?: CollectionRecord | null;
  route_code?: string;
  truck_number?: string;
  collected_volume_kg?: number;
}

export interface CollectionRecord {
  id: string;
  schedule_id: string;
  collector_id: string;
  started_at: string | null;
  completed_at: string | null;
  status: 'In Progress' | 'Completed';
  truck_number: string;
  collected_volume_kg: number;
  collector_notes: string;
}

export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export interface DisposalSubmission {
  id: string;
  schedule_id: string;
  resident_id: string;
  resident_name?: string;
  household_id: string;
  household_number?: string;
  purok_id: string;
  purok_name?: string;
  waste_type: string;
  bag_count: number;
  notes: string;
  proof_url?: string;
  submission_timestamp: string;
  created_at: string;
  scheduled_date?: string;
  verification_status?: VerificationStatus;
  verification_remarks?: string;
  verified_at?: string | null;
  leader_name?: string | null;
}

export interface PaymentSubmission {
  id: string;
  resident_id: string;
  resident_name?: string;
  household_id: string;
  household_number?: string;
  purok_id: string;
  purok_name?: string;
  period_start: string;
  period_end: string;
  amount: number;
  payment_method: 'Cash to Leader' | 'GCash' | 'Maya' | 'Barangay Hall';
  reference_number: string;
  proof_url?: string;
  status: VerificationStatus;
  reviewed_by_leader_id?: string | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export type EndorsementStatus = 'Pending' | 'Approved' | 'Rejected';

export interface EndorsementRequest {
  id: string;
  resident_id: string;
  resident_name?: string;
  resident_contact?: string;
  household_number?: string;
  household_address?: string;
  purok_id: string;
  purok_name?: string;
  leader_id: string;
  leader_name?: string;
  purpose: string;
  details: string;
  status: EndorsementStatus;
  remarks?: string | null;
  certificate_code?: string | null;
  certificate_number?: string | null;
  issued_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Schedule Update' | 'Community Advisory' | 'Policy Advisory' | 'Collection Alert';
  priority: 'Normal' | 'Important' | 'Urgent';
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'schedule' | 'disposal' | 'payment' | 'endorsement' | 'system' | 'announcement';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface DashboardStats {
  counts: {
    residents: number;
    households: number;
    collectors: number;
    leaders: number;
    schedules: number;
    schedules_completed: number;
    schedules_in_progress: number;
    schedules_pending: number;
    disposals_submitted: number;
    disposals_verified: number;
    disposals_pending: number;
    payments_total: number;
    payments_verified: number;
    payments_pending: number;
    total_funds_collected: number;
    endorsements_total: number;
    endorsements_approved: number;
    endorsements_pending: number;
  };
  total_households?: number;
  total_residents?: number;
  completed_collections?: number;
  total_waste_contributions?: number;
  purok_breakdown: Array<{
    purok_id: string;
    purok_name: string;
    households: number;
    residents: number;
    schedules: number;
    completed: number;
    compliance_rate: number;
    total_contributions: number;
  }>;
}
