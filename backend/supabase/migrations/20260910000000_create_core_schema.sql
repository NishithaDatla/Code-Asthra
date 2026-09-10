-- SIH 26032 Smart Procurement Flow Management System
-- Migration: 20260910000000_create_core_schema.sql
-- Description: Initial Core PostgreSQL Database Schema

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================================================
-- 1. ENUM TYPES
-- ==================================================

-- User Roles
CREATE TYPE user_role_enum AS ENUM (
  'FARMER',
  'CENTRE_STAFF',
  'CENTRE_ADMIN',
  'SYSTEM_ADMIN'
);

-- Centre Status
CREATE TYPE centre_status_enum AS ENUM (
  'OPEN',
  'CLOSED',
  'PAUSED'
);

-- Congestion Level
CREATE TYPE congestion_level_enum AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

-- Request Status
CREATE TYPE request_status_enum AS ENUM (
  'SUBMITTED',
  'APPROVED',
  'SLOT_BOOKED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED'
);

-- Booking Status (LOCKED STATUS VALUES)
CREATE TYPE booking_status_enum AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

-- Queue Status (LOCKED STATUS VALUES)
CREATE TYPE queue_status_enum AS ENUM (
  'WAITING',
  'CALLED',
  'IN_SERVICE',
  'COMPLETED',
  'SKIPPED'
);

-- Procurement Status (LOCKED STATUS VALUES)
CREATE TYPE procurement_status_enum AS ENUM (
  'BOOKED',
  'CHECKED_IN',
  'VERIFICATION',
  'QUALITY_CHECK',
  'WEIGHING',
  'ACCEPTED',
  'REJECTED',
  'PROCUREMENT_COMPLETED'
);

-- Quality Status
CREATE TYPE quality_status_enum AS ENUM (
  'PASSED',
  'FAILED',
  'CONDITIONAL'
);

-- Payment Status (LOCKED STATUS VALUES)
CREATE TYPE payment_status_enum AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

-- Queue Event Type
CREATE TYPE queue_event_type_enum AS ENUM (
  'TOKEN_ISSUED',
  'CALLED',
  'SERVICE_STARTED',
  'SERVICE_COMPLETED',
  'SKIPPED'
);

-- Notification Type
CREATE TYPE notification_type_enum AS ENUM (
  'BOOKING_CONFIRMED',
  'SLOT_REMINDER',
  'QUEUE_CALLED',
  'PROCUREMENT_UPDATED',
  'PAYMENT_PROCESSED',
  'SYSTEM_ALERT'
);

-- ==================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ==================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 3. CORE TABLES (16 ENTITIES)
-- ==================================================

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'FARMER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Farmers Table
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farmer_code VARCHAR(50) UNIQUE NOT NULL,
    land_size_acres NUMERIC(10, 2),
    address_line TEXT,
    village_or_city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_farmers_updated_at
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Procurement Centres Table
CREATE TABLE procurement_centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address_line TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    total_counters INTEGER NOT NULL DEFAULT 1 CHECK (total_counters >= 1),
    daily_capacity_quintals NUMERIC(12, 2) NOT NULL DEFAULT 1000.00 CHECK (daily_capacity_quintals > 0),
    status centre_status_enum NOT NULL DEFAULT 'OPEN',
    congestion_level congestion_level_enum NOT NULL DEFAULT 'LOW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_procurement_centres_updated_at
    BEFORE UPDATE ON procurement_centres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Centre Staff Table
CREATE TABLE centre_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
    staff_role VARCHAR(50) NOT NULL DEFAULT 'OFFICER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_centre_staff_updated_at
    BEFORE UPDATE ON centre_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Centre Counters Table
CREATE TABLE centre_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    counter_number INTEGER NOT NULL,
    counter_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_centre_counter UNIQUE (centre_id, counter_number)
);

CREATE TRIGGER update_centre_counters_updated_at
    BEFORE UPDATE ON centre_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Crops Table
CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    msp_per_quintal NUMERIC(10, 2) NOT NULL CHECK (msp_per_quintal >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_crops_updated_at
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Procurement Requests Table
CREATE TABLE procurement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    estimated_quantity_quintals NUMERIC(10, 2) NOT NULL CHECK (estimated_quantity_quintals > 0),
    status request_status_enum NOT NULL DEFAULT 'SUBMITTED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_procurement_requests_updated_at
    BEFORE UPDATE ON procurement_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Slots Table
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity_quintals NUMERIC(10, 2) NOT NULL CHECK (max_capacity_quintals > 0),
    booked_capacity_quintals NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (booked_capacity_quintals >= 0),
    max_farmers INTEGER NOT NULL DEFAULT 20 CHECK (max_farmers > 0),
    booked_farmers INTEGER NOT NULL DEFAULT 0 CHECK (booked_farmers >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_slot_times CHECK (end_time > start_time),
    CONSTRAINT check_slot_capacity CHECK (booked_capacity_quintals <= max_capacity_quintals),
    CONSTRAINT check_slot_farmers CHECK (booked_farmers <= max_farmers),
    CONSTRAINT uq_centre_slot_time UNIQUE (centre_id, slot_date, start_time, end_time)
);

CREATE TRIGGER update_slots_updated_at
    BEFORE UPDATE ON slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    procurement_request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE RESTRICT,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
    quantity_quintals NUMERIC(10, 2) NOT NULL CHECK (quantity_quintals > 0),
    status booking_status_enum NOT NULL DEFAULT 'CONFIRMED',
    check_in_time TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active Duplicate Booking Prevention (Partial Unique Index)
CREATE UNIQUE INDEX uq_active_request_booking
ON bookings (procurement_request_id)
WHERE status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN');

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Queue Entries Table
CREATE TABLE queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(50) NOT NULL,
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
    counter_id UUID REFERENCES centre_counters(id) ON DELETE SET NULL,
    status queue_status_enum NOT NULL DEFAULT 'WAITING',
    called_at TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_queue_entries_updated_at
    BEFORE UPDATE ON queue_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Queue Events Table
CREATE TABLE queue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id UUID NOT NULL REFERENCES queue_entries(id) ON DELETE CASCADE,
    event_type queue_event_type_enum NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Procurement Records Table
CREATE TABLE procurement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    status procurement_status_enum NOT NULL DEFAULT 'CHECKED_IN',
    gross_weight_quintals NUMERIC(10, 2) CHECK (gross_weight_quintals >= 0),
    tare_weight_quintals NUMERIC(10, 2) CHECK (tare_weight_quintals >= 0),
    net_weight_quintals NUMERIC(10, 2) CHECK (net_weight_quintals >= 0),
    rate_per_quintal NUMERIC(10, 2) CHECK (rate_per_quintal >= 0),
    total_amount NUMERIC(12, 2) CHECK (total_amount >= 0),
    verified_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_procurement_records_updated_at
    BEFORE UPDATE ON procurement_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Quality Checks Table
CREATE TABLE quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procurement_record_id UUID NOT NULL REFERENCES procurement_records(id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    moisture_content_pct NUMERIC(5, 2) CHECK (moisture_content_pct >= 0 AND moisture_content_pct <= 100),
    foreign_matter_pct NUMERIC(5, 2) CHECK (foreign_matter_pct >= 0 AND foreign_matter_pct <= 100),
    damaged_grains_pct NUMERIC(5, 2) CHECK (damaged_grains_pct >= 0 AND damaged_grains_pct <= 100),
    status quality_status_enum NOT NULL DEFAULT 'PASSED',
    remarks TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference VARCHAR(50) UNIQUE NOT NULL,
    procurement_record_id UUID NOT NULL UNIQUE REFERENCES procurement_records(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status payment_status_enum NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
    transaction_id VARCHAR(100),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 15. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Centre Metrics Table
CREATE TABLE centre_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    waiting_count INTEGER NOT NULL DEFAULT 0 CHECK (waiting_count >= 0),
    avg_wait_time_minutes NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (avg_wait_time_minutes >= 0),
    avg_processing_time_minutes NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (avg_processing_time_minutes >= 0),
    congestion_level congestion_level_enum NOT NULL DEFAULT 'LOW',
    today_total_procured_quintals NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (today_total_procured_quintals >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 4. INDEXES
-- ==================================================

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_farmers_user ON farmers(user_id);
CREATE INDEX idx_centre_staff_centre ON centre_staff(centre_id);
CREATE INDEX idx_procurement_requests_farmer ON procurement_requests(farmer_id);
CREATE INDEX idx_procurement_requests_crop ON procurement_requests(crop_id);
CREATE INDEX idx_slots_centre_date ON slots(centre_id, slot_date);
CREATE INDEX idx_bookings_farmer ON bookings(farmer_id);
CREATE INDEX idx_bookings_slot ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_queue_entries_booking ON queue_entries(booking_id);
CREATE INDEX idx_queue_entries_centre_status ON queue_entries(centre_id, status);
CREATE INDEX idx_queue_events_queue_entry ON queue_events(queue_entry_id);
CREATE INDEX idx_procurement_records_booking ON procurement_records(booking_id);
CREATE INDEX idx_quality_checks_record ON quality_checks(procurement_record_id);
CREATE INDEX idx_payments_procurement_record ON payments(procurement_record_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_centre_metrics_centre_time ON centre_metrics(centre_id, recorded_at DESC);
