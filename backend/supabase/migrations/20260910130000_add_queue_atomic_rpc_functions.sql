-- SIH 26032 Smart Procurement Flow Management System
-- Migration: 20260910130000_add_queue_atomic_rpc_functions.sql
-- Description: Phase 2A Atomic PostgreSQL RPC functions for Queue Check-in & Queue Status Transitions

-- ==================================================
-- 1. ATOMIC QUEUE CHECK-IN RPC FUNCTION
-- ==================================================

CREATE OR REPLACE FUNCTION fn_check_in_booking(
  p_booking_id UUID,
  p_token_number VARCHAR(50) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking RECORD;
  v_centre_code VARCHAR(50);
  v_existing_queue_id UUID;
  v_token_number VARCHAR(50);
  v_queue_entry RECORD;
BEGIN
  -- 1. Lock booking row for update and retrieve associated centre_id
  SELECT b.id, b.status, s.centre_id INTO v_booking
  FROM bookings b
  JOIN slots s ON s.id = b.slot_id
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking ID % not found', p_booking_id;
  END IF;

  -- 2. Verify booking status is CONFIRMED
  IF v_booking.status != 'CONFIRMED' THEN
    RAISE EXCEPTION 'Booking status must be CONFIRMED for check-in. Current status: %', v_booking.status;
  END IF;

  -- 3. Verify no existing queue entry for this booking
  SELECT id INTO v_existing_queue_id
  FROM queue_entries
  WHERE booking_id = p_booking_id;

  IF v_existing_queue_id IS NOT NULL THEN
    RAISE EXCEPTION 'Queue entry already exists for booking %', p_booking_id;
  END IF;

  -- 4. Determine token number
  IF p_token_number IS NOT NULL AND TRIM(p_token_number) != '' THEN
    v_token_number := TRIM(p_token_number);
  ELSE
    SELECT centre_code INTO v_centre_code
    FROM procurement_centres
    WHERE id = v_booking.centre_id;

    v_token_number := 'TK-' || COALESCE(v_centre_code, 'CTR') || '-' || UPPER(SUBSTRING(p_booking_id::text FROM 1 FOR 8));
  END IF;

  -- 5. Update Booking status to CHECKED_IN
  UPDATE bookings
  SET status = 'CHECKED_IN',
      check_in_time = NOW(),
      updated_at = NOW()
  WHERE id = p_booking_id;

  -- 6. Create queue_entries record with status WAITING
  INSERT INTO queue_entries (
    token_number,
    booking_id,
    centre_id,
    status
  ) VALUES (
    v_token_number,
    p_booking_id,
    v_booking.centre_id,
    'WAITING'
  )
  RETURNING * INTO v_queue_entry;

  -- 7. Insert queue_events record (TOKEN_ISSUED)
  INSERT INTO queue_events (
    queue_entry_id,
    event_type,
    metadata
  ) VALUES (
    v_queue_entry.id,
    'TOKEN_ISSUED',
    COALESCE(p_metadata, '{}'::jsonb)
  );

  -- 8. Return created queue entry as JSONB
  RETURN to_jsonb(v_queue_entry);
END;
$$;

-- Revoke default PUBLIC execution privileges and restrict to service_role
REVOKE EXECUTE ON FUNCTION fn_check_in_booking(UUID, VARCHAR, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_check_in_booking(UUID, VARCHAR, JSONB) TO service_role;


-- ==================================================
-- 2. ATOMIC QUEUE STATUS TRANSITION RPC FUNCTION
-- ==================================================

CREATE OR REPLACE FUNCTION fn_update_queue_status(
  p_queue_entry_id UUID,
  p_target_status queue_status_enum,
  p_counter_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entry RECORD;
  v_counter RECORD;
  v_booking RECORD;
  v_derived_event queue_event_type_enum;
  v_updated_entry RECORD;
BEGIN
  -- 1. Lock queue entry row for update
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE id = p_queue_entry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue entry % not found', p_queue_entry_id;
  END IF;

  -- 2. Reject arbitrary counter modifications on non-CALLED transitions
  IF p_target_status != 'CALLED' AND p_counter_id IS NOT NULL THEN
    RAISE EXCEPTION 'Counter ID cannot be supplied or modified during status transition to %', p_target_status;
  END IF;

  -- 3. Validate transition rules, derive event, and enforce counter/booking constraints
  IF v_entry.status = 'WAITING' AND p_target_status = 'CALLED' THEN
    v_derived_event := 'CALLED';

    IF p_counter_id IS NULL THEN
      RAISE EXCEPTION 'Counter ID is required when transitioning queue status from WAITING to CALLED';
    END IF;

    SELECT id, centre_id, is_active INTO v_counter
    FROM centre_counters
    WHERE id = p_counter_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Counter ID % not found', p_counter_id;
    END IF;

    IF v_counter.centre_id != v_entry.centre_id THEN
      RAISE EXCEPTION 'Counter % does not belong to procurement centre %', p_counter_id, v_entry.centre_id;
    END IF;

    IF NOT v_counter.is_active THEN
      RAISE EXCEPTION 'Counter % is not active', p_counter_id;
    END IF;

  ELSIF v_entry.status = 'WAITING' AND p_target_status = 'SKIPPED' THEN
    v_derived_event := 'SKIPPED';

  ELSIF v_entry.status = 'CALLED' AND p_target_status = 'IN_SERVICE' THEN
    v_derived_event := 'SERVICE_STARTED';

  ELSIF v_entry.status = 'CALLED' AND p_target_status = 'SKIPPED' THEN
    v_derived_event := 'SKIPPED';

  ELSIF v_entry.status = 'IN_SERVICE' AND p_target_status = 'COMPLETED' THEN
    v_derived_event := 'SERVICE_COMPLETED';

    -- Lock and validate associated booking status before completing
    SELECT id, status INTO v_booking
    FROM bookings
    WHERE id = v_entry.booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Booking ID % associated with queue entry not found', v_entry.booking_id;
    END IF;

    IF v_booking.status != 'CHECKED_IN' THEN
      RAISE EXCEPTION 'Booking status must be CHECKED_IN for completion. Current status: %', v_booking.status;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid queue status transition from % to %', v_entry.status, p_target_status;
  END IF;

  -- 4. Update queue_entries status, counter_id, and timestamps
  UPDATE queue_entries
  SET status = p_target_status,
      counter_id = CASE WHEN p_target_status = 'CALLED' THEN p_counter_id ELSE counter_id END,
      called_at = CASE WHEN p_target_status = 'CALLED' THEN NOW() ELSE called_at END,
      service_started_at = CASE WHEN p_target_status = 'IN_SERVICE' THEN NOW() ELSE service_started_at END,
      completed_at = CASE WHEN p_target_status = 'COMPLETED' THEN NOW() ELSE completed_at END,
      updated_at = NOW()
  WHERE id = p_queue_entry_id
  RETURNING * INTO v_updated_entry;

  -- 5. Synchronize bookings status if COMPLETED
  IF p_target_status = 'COMPLETED' THEN
    UPDATE bookings
    SET status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = v_entry.booking_id;
  END IF;

  -- 6. Insert queue event audit log with derived event type
  INSERT INTO queue_events (
    queue_entry_id,
    event_type,
    metadata
  ) VALUES (
    p_queue_entry_id,
    v_derived_event,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  -- 7. Return updated queue entry JSON
  RETURN to_jsonb(v_updated_entry);
END;
$$;

-- Revoke default PUBLIC execution privileges and restrict to service_role
REVOKE EXECUTE ON FUNCTION fn_update_queue_status(UUID, queue_status_enum, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_update_queue_status(UUID, queue_status_enum, UUID, JSONB) TO service_role;
