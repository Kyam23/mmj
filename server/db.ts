/**
 * SMART GARBAGE MONITORING SYSTEM - BARANGAY BANG-BANG, CORDOVA, CEBU
 * Database Connection & Dual-Engine Manager (Aiven MySQL 8.x + Local Persistent Engine)
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export interface DBConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

const config: DBConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: process.env.MYSQL_SSL === 'true' || true,
};

let pool: mysql.Pool | null = null;
let useAivenMySQL = false;

// Local JSON persistent storage path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

// Memory cache of local data
export interface AppDatabase {
  users: any[];
  puroks: any[];
  households: any[];
  collection_schedules: any[];
  collection_records: any[];
  disposal_submissions: any[];
  disposal_verifications: any[];
  payment_submissions: any[];
  endorsement_requests: any[];
  notifications: any[];
  announcements: any[];
  activity_logs: any[];
  system_settings: any[];
}

let localStore: AppDatabase = {
  users: [],
  puroks: [],
  households: [],
  collection_schedules: [],
  collection_records: [],
  disposal_submissions: [],
  disposal_verifications: [],
  payment_submissions: [],
  endorsement_requests: [],
  notifications: [],
  announcements: [],
  activity_logs: [],
  system_settings: [],
};

// Seed initial dataset for Barangay Bang-Bang, Cordova, Cebu
function getInitialSeedData(): AppDatabase {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    system_settings: [
      { id: 'sett-1', setting_key: 'weekly_contribution_fee', setting_value: '5.00', description: 'Weekly solid waste contribution fee per household in PHP', updated_at: now.toISOString() },
      { id: 'sett-2', setting_key: 'barangay_name', setting_value: 'Barangay Bang-Bang', description: 'Official Barangay Name', updated_at: now.toISOString() },
      { id: 'sett-3', setting_key: 'municipality_name', setting_value: 'Cordova', description: 'Municipality', updated_at: now.toISOString() },
      { id: 'sett-4', setting_key: 'province_name', setting_value: 'Cebu', description: 'Province', updated_at: now.toISOString() },
      { id: 'sett-5', setting_key: 'barangay_captain', setting_value: 'Hon. Artemio Degamo', description: 'Incumbent Punong Barangay (Admin)', updated_at: now.toISOString() },
      { id: 'sett-6', setting_key: 'contact_hotline', setting_value: '(032) 496-8120 / +63 917 849 2031', description: 'Barangay Bang-Bang Operations Contact Hotline', updated_at: now.toISOString() },
      { id: 'sett-7', setting_key: 'gcash_treasury_number', setting_value: '0917-849-2031 (Barangay Bang-Bang Waste Fund)', description: 'Official GCash payment destination for collection fee contributions', updated_at: now.toISOString() }
    ],
    puroks: [
      { id: 'pur-1', name: 'Purok Mangga', description: 'Coastal residential zone with fishing landing site and access to Mangga chapel road', target_collection_days: 'Monday, Thursday', leader_id: 'usr-ldr-1', created_at: now.toISOString() },
      { id: 'pur-2', name: 'Purok Nangka', description: 'Central neighborhood surrounding the community elementary school and sports plaza', target_collection_days: 'Tuesday, Friday', leader_id: 'usr-ldr-2', created_at: now.toISOString() },
      { id: 'pur-3', name: 'Purok Saging', description: 'Agricultural and residential border section near mangrove preservation perimeter', target_collection_days: 'Wednesday, Saturday', leader_id: 'usr-ldr-3', created_at: now.toISOString() },
      { id: 'pur-4', name: 'Purok Sambag', description: 'Commercial intersection section with local sari-sari stalls and bakery row', target_collection_days: 'Monday, Thursday', leader_id: 'usr-ldr-4', created_at: now.toISOString() },
      { id: 'pur-5', name: 'Purok Santol', description: 'Interior residential sector with closely-knit household clusters and footpaths', target_collection_days: 'Tuesday, Friday', leader_id: null, created_at: now.toISOString() },
      { id: 'pur-6', name: 'Purok Pag-asa', description: 'Newer settlement district with active youth organization and community garden', target_collection_days: 'Wednesday, Saturday', leader_id: null, created_at: now.toISOString() },
      { id: 'pur-7', name: 'Purok Malinawon', description: 'Quiet peripheral coastal strip with seaside residential households', target_collection_days: 'Friday, Sunday', leader_id: null, created_at: now.toISOString() }
    ],
    households: [
      { id: 'hh-1', household_number: 'HH-MNG-001', purok_id: 'pur-1', head_name: 'Maria Clara Deatras', contact_number: '0917-555-0101', address_details: 'Sitio Seaside, Purok Mangga, Bang-Bang', family_member_count: 4, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-2', household_number: 'HH-MNG-002', purok_id: 'pur-1', head_name: 'Pedro Alcantara', contact_number: '0918-555-0102', address_details: 'Cor. Chapel Lane, Purok Mangga, Bang-Bang', family_member_count: 5, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-3', household_number: 'HH-NGK-001', purok_id: 'pur-2', head_name: 'Juan Dela Cruz', contact_number: '0920-555-0201', address_details: 'Near Elementary School, Purok Nangka', family_member_count: 3, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-4', household_number: 'HH-NGK-002', purok_id: 'pur-2', head_name: 'Lourdes Mendoza', contact_number: '0922-555-0202', address_details: 'Block 3 Lot 14, Purok Nangka, Bang-Bang', family_member_count: 6, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-5', household_number: 'HH-SAG-001', purok_id: 'pur-3', head_name: 'Elena Ramos', contact_number: '0923-555-0301', address_details: 'Mangrove View Road, Purok Saging', family_member_count: 4, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-6', household_number: 'HH-SMB-001', purok_id: 'pur-4', head_name: 'Ramon Gutierrez', contact_number: '0925-555-0401', address_details: 'Main Highway junction, Purok Sambag', family_member_count: 5, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-7', household_number: 'HH-SNT-001', purok_id: 'pur-5', head_name: 'Salvacion Fernandez', contact_number: '0927-555-0501', address_details: 'Interior Alley 2, Purok Santol', family_member_count: 3, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-8', household_number: 'HH-PAG-001', purok_id: 'pur-6', head_name: 'Nestor Villamor', contact_number: '0929-555-0601', address_details: 'Community Garden St., Purok Pag-asa', family_member_count: 4, waste_segregation_compliant: true, created_at: now.toISOString() },
      { id: 'hh-9', household_number: 'HH-MLN-001', purok_id: 'pur-7', head_name: 'Teresita Cañete', contact_number: '0930-555-0701', address_details: 'Coastal Dyke Rd, Purok Malinawon', family_member_count: 2, waste_segregation_compliant: true, created_at: now.toISOString() }
    ],
    users: [
      // Admin: Barangay Captain
      {
        id: 'usr-admin',
        username: 'captain.degamo',
        email: 'captain@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', // Password123!
        full_name: 'Hon. Artemio Degamo (Barangay Captain)',
        role: 'admin',
        purok_id: null,
        household_id: null,
        contact_number: '0917-849-2031',
        status: 'active',
        created_at: now.toISOString()
      },
      // Collectors
      {
        id: 'usr-col-1',
        username: 'collector.danilo',
        email: 'danilo.enoc@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Danilo Enoc',
        role: 'collector',
        purok_id: null,
        household_id: null,
        contact_number: '0918-333-1001',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-col-2',
        username: 'collector.bernardo',
        email: 'bernardo.casquejo@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Bernardo Casquejo',
        role: 'collector',
        purok_id: null,
        household_id: null,
        contact_number: '0919-333-1002',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-col-3',
        username: 'collector.eduardo',
        email: 'eduardo.berdin@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Eduardo Berdin',
        role: 'collector',
        purok_id: null,
        household_id: null,
        contact_number: '0920-333-1003',
        status: 'active',
        created_at: now.toISOString()
      },
      // Purok Leaders
      {
        id: 'usr-ldr-1',
        username: 'leader.rolando',
        email: 'rolando.cabigas@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Rolando Cabigas',
        role: 'leader',
        purok_id: 'pur-1',
        household_id: null,
        contact_number: '0921-444-2001',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-ldr-2',
        username: 'leader.marilou',
        email: 'marilou.dinopol@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Marilou Dinopol',
        role: 'leader',
        purok_id: 'pur-2',
        household_id: null,
        contact_number: '0922-444-2002',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-ldr-3',
        username: 'leader.crispin',
        email: 'crispin.ando@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Crispin Ando',
        role: 'leader',
        purok_id: 'pur-3',
        household_id: null,
        contact_number: '0923-444-2003',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-ldr-4',
        username: 'leader.gemma',
        email: 'gemma.jumaoas@bangbang-cordova.gov.ph',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Gemma Jumao-as',
        role: 'leader',
        purok_id: 'pur-4',
        household_id: null,
        contact_number: '0924-444-2004',
        status: 'active',
        created_at: now.toISOString()
      },
      // Residents
      {
        id: 'usr-res-1',
        username: 'resident.maria',
        email: 'maria.deatras@gmail.com',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Maria Clara Deatras',
        role: 'resident',
        purok_id: 'pur-1',
        household_id: 'hh-1',
        contact_number: '0917-555-0101',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-res-2',
        username: 'resident.juan',
        email: 'juan.delacruz@gmail.com',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Juan Dela Cruz',
        role: 'resident',
        purok_id: 'pur-2',
        household_id: 'hh-3',
        contact_number: '0920-555-0201',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-res-3',
        username: 'resident.elena',
        email: 'elena.ramos@gmail.com',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Elena Ramos',
        role: 'resident',
        purok_id: 'pur-3',
        household_id: 'hh-5',
        contact_number: '0923-555-0301',
        status: 'active',
        created_at: now.toISOString()
      },
      {
        id: 'usr-res-4',
        username: 'resident.pedro',
        email: 'pedro.alcantara@gmail.com',
        password_hash: '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e',
        full_name: 'Pedro Alcantara',
        role: 'resident',
        purok_id: 'pur-1',
        household_id: 'hh-2',
        contact_number: '0918-555-0102',
        status: 'active',
        created_at: now.toISOString()
      }
    ],
    collection_schedules: [
      {
        id: 'sch-1',
        purok_id: 'pur-1',
        collector_id: 'usr-col-1',
        scheduled_date: todayStr,
        time_slot: '06:00 AM - 09:00 AM',
        waste_type: 'Biodegradable',
        status: 'In Progress',
        notes: 'Priority collection of organic kitchen and garden leaves along Sitio Seaside road',
        created_by: 'usr-admin',
        created_at: now.toISOString()
      },
      {
        id: 'sch-2',
        purok_id: 'pur-2',
        collector_id: 'usr-col-2',
        scheduled_date: todayStr,
        time_slot: '09:30 AM - 12:00 PM',
        waste_type: 'Non-Biodegradable',
        status: 'Scheduled',
        notes: 'Residual plastics, styrofoam, and dry non-recyclable domestic items',
        created_by: 'usr-admin',
        created_at: now.toISOString()
      },
      {
        id: 'sch-3',
        purok_id: 'pur-3',
        collector_id: 'usr-col-1',
        scheduled_date: tomorrow,
        time_slot: '06:00 AM - 09:00 AM',
        waste_type: 'Recyclable',
        status: 'Scheduled',
        notes: 'Corrugated cartons, clean PET bottles, beverage aluminum cans',
        created_by: 'usr-admin',
        created_at: now.toISOString()
      },
      {
        id: 'sch-4',
        purok_id: 'pur-4',
        collector_id: 'usr-col-3',
        scheduled_date: tomorrow,
        time_slot: '02:00 PM - 05:00 PM',
        waste_type: 'Biodegradable',
        status: 'Scheduled',
        notes: 'Commercial sector and bakery lane green wastes',
        created_by: 'usr-admin',
        created_at: now.toISOString()
      },
      {
        id: 'sch-5',
        purok_id: 'pur-1',
        collector_id: 'usr-col-1',
        scheduled_date: threeDaysAgo,
        time_slot: '06:00 AM - 08:30 AM',
        waste_type: 'Recyclable',
        status: 'Completed',
        notes: 'All resident bins gathered successfully. Total 280kg delivered to MRF.',
        created_by: 'usr-admin',
        created_at: now.toISOString()
      }
    ],
    collection_records: [
      {
        id: 'rec-1',
        schedule_id: 'sch-1',
        collector_id: 'usr-col-1',
        started_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        completed_at: null,
        status: 'In Progress',
        truck_number: 'LGU-BangBang-Compactor-01',
        collected_volume_kg: 145.5,
        collector_notes: 'Started at Sitio Seaside; proceeding toward chapel street.'
      },
      {
        id: 'rec-5',
        schedule_id: 'sch-5',
        collector_id: 'usr-col-1',
        started_at: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(now.getTime() - 70 * 60 * 60 * 1000).toISOString(),
        status: 'Completed',
        truck_number: 'LGU-BangBang-Compactor-01',
        collected_volume_kg: 280.0,
        collector_notes: 'Purok Mangga residents compliant. Fully sorted materials.'
      }
    ],
    disposal_submissions: [
      {
        id: 'sub-1',
        schedule_id: 'sch-1',
        resident_id: 'usr-res-1',
        household_id: 'hh-1',
        purok_id: 'pur-1',
        waste_type: 'Biodegradable',
        bag_count: 2,
        notes: 'Two green sacks of organic kitchen wastes placed by our main gate bin.',
        proof_url: '',
        submission_timestamp: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString()
      },
      {
        id: 'sub-2',
        schedule_id: 'sch-1',
        resident_id: 'usr-res-4',
        household_id: 'hh-2',
        purok_id: 'pur-1',
        waste_type: 'Biodegradable',
        bag_count: 1,
        notes: 'Garden clippings and coconut husks packed in biodegradable sack.',
        proof_url: '',
        submission_timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 'sub-5',
        schedule_id: 'sch-5',
        resident_id: 'usr-res-1',
        household_id: 'hh-1',
        purok_id: 'pur-1',
        waste_type: 'Recyclable',
        bag_count: 3,
        notes: 'Cardboard boxes and plastic bottles cleanly bound.',
        proof_url: '',
        submission_timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()
      }
    ],
    disposal_verifications: [
      {
        id: 'ver-1',
        submission_id: 'sub-1',
        leader_id: 'usr-ldr-1',
        status: 'Pending',
        remarks: '',
        verified_at: null,
        created_at: now.toISOString()
      },
      {
        id: 'ver-2',
        submission_id: 'sub-2',
        leader_id: 'usr-ldr-1',
        status: 'Pending',
        remarks: '',
        verified_at: null,
        created_at: now.toISOString()
      },
      {
        id: 'ver-5',
        submission_id: 'sub-5',
        leader_id: 'usr-ldr-1',
        status: 'Verified',
        remarks: 'Personal on-site visual inspection completed at Sitio Seaside.',
        verified_at: new Date(now.getTime() - 71 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 71 * 60 * 60 * 1000).toISOString()
      }
    ],
    payment_submissions: [
      {
        id: 'pay-1',
        resident_id: 'usr-res-1',
        household_id: 'hh-1',
        purok_id: 'pur-1',
        period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: todayStr,
        amount: 5.0,
        payment_method: 'GCash',
        reference_number: 'GCASH-9921402831',
        proof_url: '',
        status: 'Pending',
        reviewed_by_leader_id: null,
        reviewed_at: null,
        rejection_reason: null,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'pay-2',
        resident_id: 'usr-res-2',
        household_id: 'hh-3',
        purok_id: 'pur-2',
        period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: todayStr,
        amount: 5.0,
        payment_method: 'Cash to Leader',
        reference_number: 'CASH-P2-20261019-01',
        proof_url: '',
        status: 'Pending',
        reviewed_by_leader_id: null,
        reviewed_at: null,
        rejection_reason: null,
        created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'pay-3',
        resident_id: 'usr-res-1',
        household_id: 'hh-1',
        purok_id: 'pur-1',
        period_start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 5.0,
        payment_method: 'GCash',
        reference_number: 'GCASH-9883120194',
        proof_url: '',
        status: 'Verified',
        reviewed_by_leader_id: 'usr-ldr-1',
        reviewed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        rejection_reason: null,
        created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    endorsement_requests: [
      {
        id: 'end-1',
        resident_id: 'usr-res-1',
        purok_id: 'pur-1',
        leader_id: 'usr-ldr-1',
        purpose: 'Barangay Clearance Endorsement',
        details: 'Endorsement certificate needed for student scholarship application in Cordova LGU.',
        status: 'Pending',
        remarks: null,
        certificate_code: null,
        issued_at: null,
        created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'end-2',
        resident_id: 'usr-res-4',
        purok_id: 'pur-1',
        leader_id: 'usr-ldr-1',
        purpose: 'Waste Compliance Certificate',
        details: 'Proof of household waste segregation compliance and weekly collection fee clearance.',
        status: 'Approved',
        remarks: 'Resident Pedro Alcantara is compliant with Barangay Bang-Bang Solid Waste Ordinance.',
        certificate_code: 'BB-END-2026-08819',
        issued_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        user_id: 'usr-res-1',
        title: 'Collection Started in Purok Mangga',
        message: 'Collector Danilo Enoc has started the morning Biodegradable collection route in Purok Mangga.',
        type: 'schedule',
        link: '/schedules',
        is_read: false,
        created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-2',
        user_id: 'usr-ldr-1',
        title: 'New Disposal Record to Verify',
        message: 'Resident Maria Clara Deatras submitted 2 bags of Biodegradable waste for verification.',
        type: 'disposal',
        link: '/leader-verification',
        is_read: false,
        created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-3',
        user_id: 'usr-res-4',
        title: 'Endorsement Approved',
        message: 'Your Waste Compliance Certificate request BB-END-2026-08819 was approved by Purok Leader Rolando Cabigas.',
        type: 'endorsement',
        link: '/endorsements',
        is_read: true,
        created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
      }
    ],
    announcements: [
      {
        id: 'ann-1',
        title: 'Strict Segregation Compliance Ordinance No. 2026-04',
        content: 'Magpahibalo sa tanang residente sa Barangay Bang-Bang: hugot nga gipatuman ang "No Segregation, No Collection" policy. Palihug ibuwag ang malata (Biodegradable), dili malata (Non-Biodegradable), ug mabaligya/marecycle. Ang mga dili mupatuo pagadakpon subay sa Republic Act 9003.',
        category: 'Policy Advisory',
        priority: 'Important',
        created_by: 'usr-admin',
        is_active: true,
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ann-2',
        title: 'Schedule Adjustment for Coastal Puroks (Mangga & Malinawon)',
        content: 'Due to tidal conditions this week, morning waste collection along Sitio Seaside Purok Mangga will commence at 6:00 AM sharp to ensure compactor access before high tide.',
        category: 'Schedule Update',
        priority: 'Normal',
        created_by: 'usr-admin',
        is_active: true,
        created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ann-3',
        title: 'Weekly ₱5.00 Solid Waste Management Contribution Drive',
        content: 'Gipahinumdoman ang matag household sa pagbayad sa semanal nga ₱5.00 contribution alang sa truck fuel maintenance ug purok waste sweepers. Pwede mobayad via GCash o direct sa inyong tagsa-tagsa ka Purok Leader.',
        category: 'Community Advisory',
        priority: 'Normal',
        created_by: 'usr-admin',
        is_active: true,
        created_at: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()
      }
    ],
    activity_logs: [
      {
        id: 'act-1',
        user_id: 'usr-admin',
        action: 'CREATE_SCHEDULE',
        module: 'Schedule',
        details: 'Admin Hon. Artemio Degamo created collection schedule for Purok Mangga',
        ip_address: '192.168.1.10',
        created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 'act-2',
        user_id: 'usr-col-1',
        action: 'START_COLLECTION',
        module: 'Collector Operations',
        details: 'Danilo Enoc started collection route on Compactor 01',
        ip_address: '192.168.1.15',
        created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString()
      },
      {
        id: 'act-3',
        user_id: 'usr-res-1',
        action: 'SUBMIT_DISPOSAL',
        module: 'Disposal',
        details: 'Maria Clara Deatras submitted disposal record for Schedule sch-1',
        ip_address: '124.106.84.12',
        created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString()
      },
      {
        id: 'act-4',
        user_id: 'usr-res-1',
        action: 'SUBMIT_PAYMENT',
        module: 'Payment',
        details: 'Maria Clara Deatras submitted ₱5.00 payment (GCASH-9921402831)',
        ip_address: '124.106.84.12',
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
}

// Load or initialize local data
function initLocalStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      localStore = JSON.parse(raw);
    } else {
      localStore = getInitialSeedData();
      saveLocalStorage();
    }
  } catch (err) {
    console.warn('Initializing default in-memory database:', err);
    localStore = getInitialSeedData();
  }
}

export function saveLocalStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local database file:', err);
  }
}

// Initialize database
export async function initializeDatabase() {
  initLocalStorage();

  if (config.host && config.user && config.password) {
    try {
      console.log(`Connecting to Aiven MySQL at ${config.host}:${config.port}...`);
      pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database || 'defaultdb',
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      useAivenMySQL = true;
      console.log('Successfully connected to Aiven MySQL 8.x.');
    } catch (err) {
      console.warn('Aiven MySQL connection failed. Running on persistent local engine:', err instanceof Error ? err.message : err);
      useAivenMySQL = false;
    }
  } else {
    console.log('No external Aiven MySQL credentials supplied. Operating on local persistent database.');
    useAivenMySQL = false;
  }
}

export function isUsingAivenMySQL(): boolean {
  return useAivenMySQL;
}

export function getLocalStore(): AppDatabase {
  return localStore;
}

export function logActivity(userId: string | null, action: string, module: string, details: string, ip: string = '127.0.0.1') {
  const newLog = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    user_id: userId,
    action,
    module,
    details,
    ip_address: ip,
    created_at: new Date().toISOString()
  };
  localStore.activity_logs.unshift(newLog);
  if (localStore.activity_logs.length > 200) {
    localStore.activity_logs = localStore.activity_logs.slice(0, 200);
  }
  saveLocalStorage();
}

export function createNotification(userId: string, title: string, message: string, type: string, link: string = '') {
  const notif = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    user_id: userId,
    title,
    message,
    type,
    link,
    is_read: false,
    created_at: new Date().toISOString()
  };
  localStore.notifications.unshift(notif);
  saveLocalStorage();
  return notif;
}
