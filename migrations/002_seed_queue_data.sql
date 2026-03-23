-- ==============================================
-- SIMRS Queue Management - Seed Data for Testing
-- ==============================================
-- Run: psql -U your_user -d your_db -f migrations/002_seed_queue_data.sql
-- Remove: DELETE FROM clinic_schedules; DELETE FROM counters; DELETE FROM queue_items; DELETE FROM departments;

-- Departments (Poli / Klinik)
INSERT INTO departments (name, code, description, is_active) VALUES
    ('Poli Umum',           'A', 'Pemeriksaan umum dan konsultasi',           true),
    ('Poli Gigi',           'B', 'Perawatan dan pemeriksaan gigi',            true),
    ('Poli Anak',           'C', 'Pemeriksaan kesehatan anak',                true),
    ('Poli Mata',           'D', 'Pemeriksaan dan perawatan mata',            true),
    ('Poli Kandungan',      'E', 'Obstetri dan ginekologi',                   true),
    ('Poli Penyakit Dalam', 'F', 'Pemeriksaan penyakit dalam',               true),
    ('Laboratorium',        'L', 'Pengambilan sampel dan hasil lab',          true),
    ('Farmasi',             'R', 'Pengambilan obat dan resep',                true)
ON CONFLICT (code) DO NOTHING;

-- Counters (Loket) - 2-3 per department
INSERT INTO counters (department_id, name, code, status) VALUES
    ((SELECT id FROM departments WHERE code = 'A'), 'Loket Umum 1',       'A1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'A'), 'Loket Umum 2',       'A2', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'A'), 'Loket Umum 3',       'A3', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'B'), 'Loket Gigi 1',       'B1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'B'), 'Loket Gigi 2',       'B2', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'C'), 'Loket Anak 1',       'C1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'C'), 'Loket Anak 2',       'C2', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'D'), 'Loket Mata 1',       'D1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'E'), 'Loket Kandungan 1',  'E1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'E'), 'Loket Kandungan 2',  'E2', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'F'), 'Loket P. Dalam 1',   'F1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'F'), 'Loket P. Dalam 2',   'F2', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'L'), 'Loket Lab 1',        'L1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'L'), 'Loket Lab 2',        'L2', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'R'), 'Loket Farmasi 1',    'R1', 'inactive'),
    ((SELECT id FROM departments WHERE code = 'R'), 'Loket Farmasi 2',    'R2', 'inactive')
ON CONFLICT (department_id, code) DO NOTHING;

-- Clinic Schedules (Senin-Jumat for main departments)
-- 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
INSERT INTO clinic_schedules (department_id, day_of_week, open_time, close_time, is_active) VALUES
    -- Poli Umum: Senin-Sabtu
    ((SELECT id FROM departments WHERE code = 'A'), 1, '08:00', '16:00', true),
    ((SELECT id FROM departments WHERE code = 'A'), 2, '08:00', '16:00', true),
    ((SELECT id FROM departments WHERE code = 'A'), 3, '08:00', '16:00', true),
    ((SELECT id FROM departments WHERE code = 'A'), 4, '08:00', '16:00', true),
    ((SELECT id FROM departments WHERE code = 'A'), 5, '08:00', '14:00', true),
    ((SELECT id FROM departments WHERE code = 'A'), 6, '08:00', '12:00', true),
    -- Poli Gigi: Senin, Rabu, Jumat
    ((SELECT id FROM departments WHERE code = 'B'), 1, '09:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'B'), 3, '09:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'B'), 5, '09:00', '13:00', true),
    -- Poli Anak: Senin-Kamis
    ((SELECT id FROM departments WHERE code = 'C'), 1, '08:00', '14:00', true),
    ((SELECT id FROM departments WHERE code = 'C'), 2, '08:00', '14:00', true),
    ((SELECT id FROM departments WHERE code = 'C'), 3, '08:00', '14:00', true),
    ((SELECT id FROM departments WHERE code = 'C'), 4, '08:00', '14:00', true),
    -- Poli Mata: Selasa, Kamis
    ((SELECT id FROM departments WHERE code = 'D'), 2, '09:00', '14:00', true),
    ((SELECT id FROM departments WHERE code = 'D'), 4, '09:00', '14:00', true),
    -- Poli Kandungan: Senin, Rabu
    ((SELECT id FROM departments WHERE code = 'E'), 1, '09:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'E'), 3, '09:00', '15:00', true),
    -- Poli Penyakit Dalam: Senin-Jumat
    ((SELECT id FROM departments WHERE code = 'F'), 1, '08:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'F'), 2, '08:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'F'), 3, '08:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'F'), 4, '08:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'F'), 5, '08:00', '13:00', true),
    -- Lab & Farmasi: Senin-Sabtu
    ((SELECT id FROM departments WHERE code = 'L'), 1, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'L'), 2, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'L'), 3, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'L'), 4, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'L'), 5, '07:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'L'), 6, '07:00', '12:00', true),
    ((SELECT id FROM departments WHERE code = 'R'), 1, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'R'), 2, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'R'), 3, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'R'), 4, '07:00', '17:00', true),
    ((SELECT id FROM departments WHERE code = 'R'), 5, '07:00', '15:00', true),
    ((SELECT id FROM departments WHERE code = 'R'), 6, '07:00', '12:00', true)
ON CONFLICT (department_id, day_of_week) DO NOTHING;

-- Sample queue items for today (to see queue in action)
INSERT INTO queue_items (queue_number, patient_name, department_id, priority, status) VALUES
    ('A-001', 'Budi Santoso',    (SELECT id FROM departments WHERE code = 'A'), 'normal',    'waiting'),
    ('A-002', 'Siti Rahayu',     (SELECT id FROM departments WHERE code = 'A'), 'elderly',   'waiting'),
    ('A-003', 'Andi Pratama',    (SELECT id FROM departments WHERE code = 'A'), 'normal',    'waiting'),
    ('B-001', 'Dewi Lestari',    (SELECT id FROM departments WHERE code = 'B'), 'normal',    'waiting'),
    ('C-001', 'Rini Wulandari',  (SELECT id FROM departments WHERE code = 'C'), 'emergency', 'waiting'),
    ('C-002', 'Agus Setiawan',   (SELECT id FROM departments WHERE code = 'C'), 'normal',    'waiting'),
    ('F-001', 'Hadi Wijaya',     (SELECT id FROM departments WHERE code = 'F'), 'elderly',   'waiting'),
    ('L-001', 'Nina Kartika',    (SELECT id FROM departments WHERE code = 'L'), 'normal',    'waiting');

-- Done
SELECT 'Seed data inserted successfully!' AS status;
SELECT '  Departments: ' || COUNT(*) FROM departments;
SELECT '  Counters:    ' || COUNT(*) FROM counters;
SELECT '  Schedules:   ' || COUNT(*) FROM clinic_schedules;
SELECT '  Queue items: ' || COUNT(*) FROM queue_items;
