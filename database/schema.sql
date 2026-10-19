-- ====================================================================
-- SMART GARBAGE MONITORING SYSTEM - DATABASE SCHEMA
-- Municipality of Cordova, Province of Cebu
-- Barangay Bang-Bang
-- MySQL 8.x Compatible (Aiven MySQL & Standard Relational MySQL)
-- ====================================================================

-- Create Database if not exists
-- CREATE DATABASE IF NOT EXISTS bangbang_garbage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE bangbang_garbage_db;

-- 1. PUROKS TABLE (Barangay Bang-Bang specific puroks)
CREATE TABLE IF NOT EXISTS puroks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    target_collection_days VARCHAR(100) DEFAULT 'Tuesday, Friday',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. HOUSEHOLDS TABLE
CREATE TABLE IF NOT EXISTS households (
    id VARCHAR(36) PRIMARY KEY,
    household_number VARCHAR(50) NOT NULL UNIQUE,
    purok_id VARCHAR(36) NOT NULL,
    head_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(30),
    address_details VARCHAR(255) NOT NULL,
    family_member_count INT DEFAULT 1,
    waste_segregation_compliant BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purok_id) REFERENCES puroks(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. USERS TABLE (Admin, Collector, Leader, Resident)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('admin', 'collector', 'leader', 'resident') NOT NULL,
    purok_id VARCHAR(36) NULL,
    household_id VARCHAR(36) NULL,
    contact_number VARCHAR(30),
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purok_id) REFERENCES puroks(id) ON DELETE SET NULL,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraint to puroks leader_id after users table exists
ALTER TABLE puroks ADD COLUMN leader_id VARCHAR(36) NULL;
-- ALTER TABLE puroks ADD CONSTRAINT fk_purok_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. COLLECTION SCHEDULES TABLE (Created exclusively by Admin)
CREATE TABLE IF NOT EXISTS collection_schedules (
    id VARCHAR(36) PRIMARY KEY,
    purok_id VARCHAR(36) NOT NULL,
    collector_id VARCHAR(36) NOT NULL,
    scheduled_date DATE NOT NULL,
    time_slot VARCHAR(60) NOT NULL,
    waste_type ENUM('Biodegradable', 'Non-Biodegradable', 'Recyclable', 'Special Waste') NOT NULL DEFAULT 'Biodegradable',
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purok_id) REFERENCES puroks(id) ON DELETE RESTRICT,
    FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. COLLECTION RECORDS TABLE (Logged during operations by Collector)
CREATE TABLE IF NOT EXISTS collection_records (
    id VARCHAR(36) PRIMARY KEY,
    schedule_id VARCHAR(36) NOT NULL UNIQUE,
    collector_id VARCHAR(36) NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    status ENUM('In Progress', 'Completed') NOT NULL,
    truck_number VARCHAR(50) DEFAULT 'LGU-BangBang-01',
    collected_volume_kg DECIMAL(8,2) DEFAULT 0.00,
    collector_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES collection_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. DISPOSAL SUBMISSIONS TABLE (Submitted by Resident)
CREATE TABLE IF NOT EXISTS disposal_submissions (
    id VARCHAR(36) PRIMARY KEY,
    schedule_id VARCHAR(36) NOT NULL,
    resident_id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    purok_id VARCHAR(36) NOT NULL,
    waste_type VARCHAR(50) NOT NULL,
    bag_count INT DEFAULT 1,
    notes TEXT,
    proof_url TEXT,
    submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_resident_schedule (resident_id, schedule_id),
    FOREIGN KEY (schedule_id) REFERENCES collection_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE RESTRICT,
    FOREIGN KEY (purok_id) REFERENCES puroks(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. DISPOSAL VERIFICATIONS TABLE (Verified by assigned Purok Leader)
CREATE TABLE IF NOT EXISTS disposal_verifications (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL UNIQUE,
    leader_id VARCHAR(36) NOT NULL,
    status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    remarks TEXT,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES disposal_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PAYMENT SUBMISSIONS TABLE (Weekly ₱5.00 contribution, verified by Leader)
CREATE TABLE IF NOT EXISTS payment_submissions (
    id VARCHAR(36) PRIMARY KEY,
    resident_id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL,
    purok_id VARCHAR(36) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    amount DECIMAL(8,2) NOT NULL DEFAULT 5.00,
    payment_method ENUM('Cash to Leader', 'GCash', 'Maya', 'Barangay Hall') NOT NULL DEFAULT 'GCash',
    reference_number VARCHAR(100) NOT NULL,
    proof_url TEXT,
    status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    reviewed_by_leader_id VARCHAR(36) NULL,
    reviewed_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE RESTRICT,
    FOREIGN KEY (purok_id) REFERENCES puroks(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by_leader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ENDORSEMENT REQUESTS TABLE (Purok Leader is FINAL approving authority)
CREATE TABLE IF NOT EXISTS endorsement_requests (
    id VARCHAR(36) PRIMARY KEY,
    resident_id VARCHAR(36) NOT NULL,
    purok_id VARCHAR(36) NOT NULL,
    leader_id VARCHAR(36) NOT NULL,
    purpose VARCHAR(150) NOT NULL,
    details TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    remarks TEXT,
    certificate_code VARCHAR(50) UNIQUE,
    issued_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (purok_id) REFERENCES puroks(id) ON DELETE RESTRICT,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('schedule', 'disposal', 'payment', 'endorsement', 'system', 'announcement') DEFAULT 'system',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. ANNOUNCEMENTS TABLE (Managed by Admin)
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('Schedule Update', 'Community Advisory', 'Policy Advisory', 'Collection Alert') DEFAULT 'Community Advisory',
    priority ENUM('Normal', 'Important', 'Urgent') DEFAULT 'Normal',
    created_by VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. ACTIVITY LOGS TABLE (Audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. SYSTEM SETTINGS TABLE (Configurable parameters like weekly contribution ₱5.00)
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_schedules_purok_date ON collection_schedules(purok_id, scheduled_date);
CREATE INDEX idx_schedules_status ON collection_schedules(status);
CREATE INDEX idx_payments_resident ON payment_submissions(resident_id);
CREATE INDEX idx_payments_purok_status ON payment_submissions(purok_id, status);
CREATE INDEX idx_disposal_purok_status ON disposal_submissions(purok_id);
CREATE INDEX idx_endorsements_purok ON endorsement_requests(purok_id, status);
