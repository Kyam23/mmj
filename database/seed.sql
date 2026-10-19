-- ====================================================================
-- SMART GARBAGE MONITORING SYSTEM - SEED DATA
-- Barangay Bang-Bang, Cordova, Cebu
-- ====================================================================

-- 1. SYSTEM SETTINGS
INSERT INTO system_settings (id, setting_key, setting_value, description) VALUES
('sett-1', 'weekly_contribution_fee', '5.00', 'Official weekly garbage collection contribution fee per household in Philippine Peso (PHP)'),
('sett-2', 'barangay_name', 'Barangay Bang-Bang', 'Official Barangay Name'),
('sett-3', 'municipality_name', 'Cordova', 'Municipality'),
('sett-4', 'province_name', 'Cebu', 'Province'),
('sett-5', 'barangay_captain', 'Hon. Artemio Degamo', 'Incumbent Punong Barangay (Admin)'),
('sett-6', 'contact_hotline', '(032) 496-8120 / +63 917 849 2031', 'Barangay Bang-Bang Operations Contact Hotline'),
('sett-7', 'gcash_treasury_number', '0917-849-2031 (Barangay Bang-Bang Waste Fund)', 'Official GCash payment destination for collection fee contributions')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 2. PUROKS (Barangay Bang-Bang)
INSERT INTO puroks (id, name, description, target_collection_days) VALUES
('pur-1', 'Purok Mangga', 'Coastal residential zone with fishing landing site and access to Mangga chapel road', 'Monday, Thursday'),
('pur-2', 'Purok Nangka', 'Central neighborhood surrounding the community elementary school and basketball court', 'Tuesday, Friday'),
('pur-3', 'Purok Saging', 'Agricultural and residential border section near mangrove preservation perimeter', 'Wednesday, Saturday'),
('pur-4', 'Purok Sambag', 'Commercial intersection section with local sari-sari stalls and bakery row', 'Monday, Thursday'),
('pur-5', 'Purok Santol', 'Interior residential sector with closely-knit household clusters and footpaths', 'Tuesday, Friday'),
('pur-6', 'Purok Pag-asa', 'Newer settlement district with active youth organization and community garden', 'Wednesday, Saturday'),
('pur-7', 'Purok Malinawon', 'Quiet peripheral coastal strip with seaside residential households', 'Friday, Sunday')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. HOUSEHOLDS
INSERT INTO households (id, household_number, purok_id, head_name, contact_number, address_details, family_member_count, waste_segregation_compliant) VALUES
('hh-1', 'HH-MNG-001', 'pur-1', 'Maria Clara Deatras', '0917-555-0101', 'Sitio Seaside, Purok Mangga, Bang-Bang', 4, TRUE),
('hh-2', 'HH-MNG-002', 'pur-1', 'Pedro Alcantara', '0918-555-0102', 'Cor. Chapel Lane, Purok Mangga, Bang-Bang', 5, TRUE),
('hh-3', 'HH-NGK-001', 'pur-2', 'Juan Dela Cruz', '0920-555-0201', 'Near Elementary School, Purok Nangka', 3, TRUE),
('hh-4', 'HH-NGK-002', 'pur-2', 'Lourdes Mendoza', '0922-555-0202', 'Block 3 Lot 14, Purok Nangka, Bang-Bang', 6, TRUE),
('hh-5', 'HH-SAG-001', 'pur-3', 'Elena Ramos', '0923-555-0301', 'Mangrove View Road, Purok Saging', 4, TRUE),
('hh-6', 'HH-SMB-001', 'pur-4', 'Ramon Gutierrez', '0925-555-0401', 'Main Highway junction, Purok Sambag', 5, TRUE),
('hh-7', 'HH-SNT-001', 'pur-5', 'Salvacion Fernandez', '0927-555-0501', 'Interior Alley 2, Purok Santol', 3, TRUE),
('hh-8', 'HH-PAG-001', 'pur-6', 'Nestor Villamor', '0929-555-0601', 'Community Garden St., Purok Pag-asa', 4, TRUE),
('hh-9', 'HH-MLN-001', 'pur-7', 'Teresita Cañete', '0930-555-0701', 'Coastal Dyke Rd, Purok Malinawon', 2, TRUE)
ON DUPLICATE KEY UPDATE head_name = VALUES(head_name);

-- 4. USERS (Password for all demo accounts: 'Password123!')
-- Admin (Barangay Captain), Collectors, Leaders, Residents
INSERT INTO users (id, username, email, password_hash, full_name, role, purok_id, household_id, contact_number, status) VALUES
-- Admin (Barangay Captain Artemio Degamo)
('usr-admin', 'captain.degamo', 'captain@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Hon. Artemio Degamo (Barangay Captain)', 'admin', NULL, NULL, '0917-849-2031', 'active'),

-- Collectors
('usr-col-1', 'collector.danilo', 'danilo.enoc@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Danilo Enoc', 'collector', NULL, NULL, '0918-333-1001', 'active'),
('usr-col-2', 'collector.bernardo', 'bernardo.casquejo@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Bernardo Casquejo', 'collector', NULL, NULL, '0919-333-1002', 'active'),
('usr-col-3', 'collector.eduardo', 'eduardo.berdin@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Eduardo Berdin', 'collector', NULL, NULL, '0920-333-1003', 'active'),

-- Purok Leaders
('usr-ldr-1', 'leader.rolando', 'rolando.cabigas@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Rolando Cabigas', 'leader', 'pur-1', NULL, '0921-444-2001', 'active'),
('usr-ldr-2', 'leader.marilou', 'marilou.dinopol@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Marilou Dinopol', 'leader', 'pur-2', NULL, '0922-444-2002', 'active'),
('usr-ldr-3', 'leader.crispin', 'crispin.ando@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Crispin Ando', 'leader', 'pur-3', NULL, '0923-444-2003', 'active'),
('usr-ldr-4', 'leader.gemma', 'gemma.jumaoas@bangbang-cordova.gov.ph', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Gemma Jumao-as', 'leader', 'pur-4', NULL, '0924-444-2004', 'active'),

-- Residents
('usr-res-1', 'resident.maria', 'maria.deatras@gmail.com', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Maria Clara Deatras', 'resident', 'pur-1', 'hh-1', '0917-555-0101', 'active'),
('usr-res-2', 'resident.juan', 'juan.delacruz@gmail.com', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Juan Dela Cruz', 'resident', 'pur-2', 'hh-3', '0920-555-0201', 'active'),
('usr-res-3', 'resident.elena', 'elena.ramos@gmail.com', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Elena Ramos', 'resident', 'pur-3', 'hh-5', '0923-555-0301', 'active'),
('usr-res-4', 'resident.pedro', 'pedro.alcantara@gmail.com', '$2a$10$w09Zk1O9u5d/d2K9a4r0fOa7EwT2w4P/N6F9Z7d4X1w8L6t5u3q0e', 'Pedro Alcantara', 'resident', 'pur-1', 'hh-2', '0918-555-0102', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Update purok leader references
UPDATE puroks SET leader_id = 'usr-ldr-1' WHERE id = 'pur-1';
UPDATE puroks SET leader_id = 'usr-ldr-2' WHERE id = 'pur-2';
UPDATE puroks SET leader_id = 'usr-ldr-3' WHERE id = 'pur-3';
UPDATE puroks SET leader_id = 'usr-ldr-4' WHERE id = 'pur-4';

-- 5. COLLECTION SCHEDULES (Created by Admin)
INSERT INTO collection_schedules (id, purok_id, collector_id, scheduled_date, time_slot, waste_type, status, notes, created_by) VALUES
('sch-1', 'pur-1', 'usr-col-1', CURDATE(), '06:00 AM - 09:00 AM', 'Biodegradable', 'In Progress', 'Focus on household kitchen organic wastes and seaside bins', 'usr-admin'),
('sch-2', 'pur-2', 'usr-col-2', CURDATE(), '09:30 AM - 12:00 PM', 'Non-Biodegradable', 'Scheduled', 'Residual plastics, clean dry wrappers, non-recyclables', 'usr-admin'),
('sch-3', 'pur-3', 'usr-col-1', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:00 AM - 09:00 AM', 'Recyclable', 'Scheduled', 'Bottles, aluminum cans, cardboard packaging', 'usr-admin'),
('sch-4', 'pur-4', 'usr-col-3', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '02:00 PM - 05:00 PM', 'Biodegradable', 'Scheduled', 'Commercial market stalls and residential vegetable waste', 'usr-admin'),
('sch-5', 'pur-1', 'usr-col-1', DATE_SUB(CURDATE(), INTERVAL 3 DAY), '06:00 AM - 08:30 AM', 'Recyclable', 'Completed', 'Collection completed in full. 280kg recyclables sorted.', 'usr-admin'),
('sch-6', 'pur-2', 'usr-col-2', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '06:00 AM - 09:00 AM', 'Biodegradable', 'Completed', 'Composting site transfer completed.', 'usr-admin')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 6. COLLECTION RECORDS
INSERT INTO collection_records (id, schedule_id, collector_id, started_at, completed_at, status, truck_number, collected_volume_kg, collector_notes) VALUES
('rec-1', 'sch-1', 'usr-col-1', NOW() - INTERVAL 1 HOUR, NULL, 'In Progress', 'LGU-BangBang-Compactor-01', 145.50, 'Started at Sitio Seaside; moving towards chapel road.'),
('rec-5', 'sch-5', 'usr-col-1', DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 2 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Completed', 'LGU-BangBang-Compactor-01', 280.00, 'All households participated. 100% segregated glass and metals.'),
('rec-6', 'sch-6', 'usr-col-2', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 2 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Completed', 'LGU-BangBang-Truck-02', 320.00, 'Delivered to Cordova Municipal Solid Waste Facility.')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 7. DISPOSAL SUBMISSIONS (Residents submitting participation)
INSERT INTO disposal_submissions (id, schedule_id, resident_id, household_id, purok_id, waste_type, bag_count, notes, proof_url, submission_timestamp) VALUES
('sub-1', 'sch-1', 'usr-res-1', 'hh-1', 'pur-1', 'Biodegradable', 2, '2 green sacks of kitchen and garden clippings at gate bin', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b', NOW() - INTERVAL 45 MINUTE),
('sub-2', 'sch-1', 'usr-res-4', 'hh-2', 'pur-1', 'Biodegradable', 1, '1 standard compost bag ready outside gate', NULL, NOW() - INTERVAL 30 MINUTE),
('sub-5', 'sch-5', 'usr-res-1', 'hh-1', 'pur-1', 'Recyclable', 3, 'Clean cardboard cartons and PET bottles properly tied', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE notes = VALUES(notes);

-- 8. DISPOSAL VERIFICATIONS (Purok Leader verified)
INSERT INTO disposal_verifications (id, submission_id, leader_id, status, remarks, verified_at) VALUES
('ver-1', 'sub-1', 'usr-ldr-1', 'Pending', NULL, NULL),
('ver-2', 'sub-2', 'usr-ldr-1', 'Pending', NULL, NULL),
('ver-5', 'sub-5', 'usr-ldr-1', 'Verified', 'Inspected personally at Sitio Seaside. Proper segregation followed.', DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 9. PAYMENT SUBMISSIONS (Weekly ₱5.00 contribution)
INSERT INTO payment_submissions (id, resident_id, household_id, purok_id, period_start, period_end, amount, payment_method, reference_number, proof_url, status, reviewed_by_leader_id, reviewed_at, rejection_reason) VALUES
('pay-1', 'usr-res-1', 'hh-1', 'pur-1', CURDATE() - INTERVAL 7 DAY, CURDATE(), 5.00, 'GCash', 'GCASH-9921402831', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44', 'Pending', NULL, NULL, NULL),
('pay-2', 'usr-res-2', 'hh-3', 'pur-2', CURDATE() - INTERVAL 7 DAY, CURDATE(), 5.00, 'Cash to Leader', 'CASH-P2-20261019-01', NULL, 'Pending', NULL, NULL, NULL),
('pay-3', 'usr-res-1', 'hh-1', 'pur-1', CURDATE() - INTERVAL 14 DAY, CURDATE() - INTERVAL 8 DAY, 5.00, 'GCash', 'GCASH-9883120194', NULL, 'Verified', 'usr-ldr-1', NOW() - INTERVAL 6 DAY, NULL),
('pay-4', 'usr-res-3', 'hh-5', 'pur-3', CURDATE() - INTERVAL 7 DAY, CURDATE(), 5.00, 'Maya', 'MAYA-44129038', NULL, 'Verified', 'usr-ldr-3', NOW() - INTERVAL 1 DAY, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 10. ENDORSEMENT REQUESTS (Purok Leader is FINAL approver)
INSERT INTO endorsement_requests (id, resident_id, purok_id, leader_id, purpose, details, status, remarks, certificate_code, issued_at) VALUES
('end-1', 'usr-res-1', 'pur-1', 'usr-ldr-1', 'Barangay Clearance Endorsement', 'Endorsement for Barangay Bang-Bang Certificate of Residency and Good Standing for municipal scholarship requirements.', 'Pending', NULL, NULL, NULL),
('end-2', 'usr-res-4', 'pur-1', 'usr-ldr-1', 'Waste Compliance Certificate', 'Proof of compliant garbage segregation and up-to-date weekly collection fee for business permit renewal.', 'Approved', 'Resident Maria Clara Deatras and household HH-MNG-002 have 100% compliant waste disposal record and up-to-date dues.', 'BB-END-2026-08819', NOW() - INTERVAL 2 DAY),
('end-3', 'usr-res-3', 'pur-3', 'usr-ldr-3', 'Good Standing Verification', 'Required for local livelihood microloan endorsement in Cordova.', 'Approved', 'Verified compliant with purok solid waste management guidelines.', 'BB-END-2026-07412', NOW() - INTERVAL 5 DAY)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 11. ANNOUNCEMENTS
INSERT INTO announcements (id, title, content, category, priority, created_by, is_active) VALUES
('ann-1', 'Strict Segregation Compliance Ordinance No. 2026-04', 'Magpahibalo sa tanang residente sa Barangay Bang-Bang: hugot nga gipatuman ang "No Segregation, No Collection" policy. Palihug ibuwag ang malata (Biodegradable), dili malata (Non-Biodegradable), ug mabaligya/marecycle. Ang mga dili mupatuo pagadakpon subay sa Republic Act 9003.', 'Policy Advisory', 'Important', 'usr-admin', TRUE),
('ann-2', 'Schedule Adjustment for Coastal Puroks (Mangga & Malinawon)', 'Due to high tide schedules this week, morning waste collection along Sitio Seaside Purok Mangga will commence at 6:00 AM sharp to ensure compactor access before tidal road surges.', 'Schedule Update', 'Normal', 'usr-admin', TRUE),
('ann-3', 'Weekly ₱5.00 Solid Waste Management Contribution Drive', 'Gipahinumdoman ang matag household sa pagbayad sa semanal nga ₱5.00 contribution alang sa truck fuel maintenance ug purok waste sweepers. Pwede mobayad via GCash o direct sa inyong tagsa-tagsa ka Purok Leader.', 'Community Advisory', 'Normal', 'usr-admin', TRUE)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 12. ACTIVITY LOGS
INSERT INTO activity_logs (id, user_id, action, module, details, ip_address) VALUES
('act-1', 'usr-admin', 'CREATE_SCHEDULE', 'Schedule', 'Admin scheduled collection for Purok Mangga (Biodegradable)', '192.168.1.10'),
('act-2', 'usr-col-1', 'START_COLLECTION', 'Operations', 'Collector Danilo Enoc started collection route on Compactor 01', '192.168.1.15'),
('act-3', 'usr-res-1', 'SUBMIT_DISPOSAL', 'Disposal', 'Resident Maria Clara Deatras submitted disposal record for Schedule sch-1', '124.106.84.12'),
('act-4', 'usr-res-1', 'SUBMIT_PAYMENT', 'Payment', 'Resident Maria Clara Deatras submitted ₱5.00 payment (GCash Ref: GCASH-9921402831)', '124.106.84.12'),
('act-5', 'usr-ldr-1', 'APPROVE_ENDORSEMENT', 'Endorsement', 'Purok Leader Rolando Cabigas approved endorsement BB-END-2026-08819', '192.168.1.22');
