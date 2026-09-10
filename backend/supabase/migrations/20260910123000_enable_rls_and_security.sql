-- SIH 26032 Smart Procurement Flow Management System
-- Migration: 20260910123000_enable_rls_and_security.sql
-- Description: Enable Row Level Security (RLS) and Security Policies for all 16 core tables

-- ==================================================
-- 1. SECURITY HELPER FUNCTIONS
-- ==================================================

-- Helper to map auth.uid() to internal users.id
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper to map auth.uid() to internal farmers.id
CREATE OR REPLACE FUNCTION current_farmer_id()
RETURNS UUID AS $$
  SELECT f.id FROM farmers f
  JOIN users u ON u.id = f.user_id
  WHERE u.auth_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL 16 TABLES
-- ==================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE centre_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE centre_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE centre_metrics ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- 3. RLS POLICIES
-- ==================================================

-- 1. Users Table Policies
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- 2. Farmers Table Policies
CREATE POLICY farmers_select_own ON farmers
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY farmers_update_own ON farmers
    FOR UPDATE USING (user_id = current_user_id());

-- 3. Procurement Centres Table Policies (Authenticated Read)
CREATE POLICY centres_select_authenticated ON procurement_centres
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Centre Staff Table Policies
CREATE POLICY centre_staff_select_own ON centre_staff
    FOR SELECT USING (user_id = current_user_id());

-- 5. Centre Counters Table Policies (Authenticated Read)
CREATE POLICY counters_select_authenticated ON centre_counters
    FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Crops Table Policies (Catalog Read)
CREATE POLICY crops_select_authenticated ON crops
    FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Procurement Requests Table Policies
CREATE POLICY requests_select_own ON procurement_requests
    FOR SELECT USING (farmer_id = current_farmer_id());

CREATE POLICY requests_insert_own ON procurement_requests
    FOR INSERT WITH CHECK (farmer_id = current_farmer_id());

CREATE POLICY requests_update_own ON procurement_requests
    FOR UPDATE USING (farmer_id = current_farmer_id());

-- 8. Slots Table Policies (Authenticated Read)
CREATE POLICY slots_select_authenticated ON slots
    FOR SELECT USING (auth.role() = 'authenticated');

-- 9. Bookings Table Policies
CREATE POLICY bookings_select_own ON bookings
    FOR SELECT USING (farmer_id = current_farmer_id());

CREATE POLICY bookings_insert_own ON bookings
    FOR INSERT WITH CHECK (farmer_id = current_farmer_id());

CREATE POLICY bookings_update_own ON bookings
    FOR UPDATE USING (farmer_id = current_farmer_id());

-- 10. Queue Entries Table Policies
CREATE POLICY queue_entries_select_own ON queue_entries
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM bookings WHERE farmer_id = current_farmer_id()
        )
    );

-- 11. Queue Events Table Policies
CREATE POLICY queue_events_select_own ON queue_events
    FOR SELECT USING (
        queue_entry_id IN (
            SELECT qe.id FROM queue_entries qe
            JOIN bookings b ON b.id = qe.booking_id
            WHERE b.farmer_id = current_farmer_id()
        )
    );

-- 12. Procurement Records Table Policies
CREATE POLICY procurement_records_select_own ON procurement_records
    FOR SELECT USING (farmer_id = current_farmer_id());

-- 13. Quality Checks Table Policies
CREATE POLICY quality_checks_select_own ON quality_checks
    FOR SELECT USING (
        procurement_record_id IN (
            SELECT id FROM procurement_records WHERE farmer_id = current_farmer_id()
        )
    );

-- 14. Payments Table Policies
CREATE POLICY payments_select_own ON payments
    FOR SELECT USING (farmer_id = current_farmer_id());

-- 15. Notifications Table Policies
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (user_id = current_user_id());

-- 16. Centre Metrics Table Policies (Authenticated Read)
CREATE POLICY centre_metrics_select_authenticated ON centre_metrics
    FOR SELECT USING (auth.role() = 'authenticated');
