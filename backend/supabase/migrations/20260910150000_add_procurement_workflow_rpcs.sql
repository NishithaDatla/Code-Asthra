-- SIH 26032 Smart Procurement Flow Management System
-- Migration: 20260910150000_add_procurement_workflow_rpcs.sql
-- Description: Atomic Procurement Check-In & Procurement Completion Database RPC Functions

-- ==================================================
-- 1. UPDATE ATOMIC QUEUE CHECK-IN RPC FUNCTION
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
  -- 1. Lock booking row for update and retrieve associated centre_id and crop_id
  SELECT b.id, b.farmer_id, b.procurement_request_id, b.status, s.centre_id, pr.crop_id INTO v_booking
  FROM bookings b
  JOIN slots s ON s.id = b.slot_id
  JOIN procurement_requests pr ON pr.id = b.procurement_request_id
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

  -- 8. Create procurement_records entry with status CHECKED_IN
  INSERT INTO procurement_records (
    booking_id,
    farmer_id,
    centre_id,
    crop_id,
    status
  ) VALUES (
    p_booking_id,
    v_booking.farmer_id,
    v_booking.centre_id,
    v_booking.crop_id,
    'CHECKED_IN'
  )
  ON CONFLICT (booking_id) DO NOTHING;

  -- 9. Return created queue entry as JSONB
  RETURN to_jsonb(v_queue_entry);
END;
$$;

REVOKE EXECUTE ON FUNCTION fn_check_in_booking(UUID, VARCHAR, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_check_in_booking(UUID, VARCHAR, JSONB) TO service_role;

-- ==================================================
-- 2. ATOMIC PROCUREMENT COMPLETION RPC FUNCTION
-- ==================================================

CREATE OR REPLACE FUNCTION fn_complete_procurement(
  p_procurement_record_id UUID,
  p_completed_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record RECORD;
  v_payment RECORD;
  v_payment_ref VARCHAR(50);
  v_result JSONB;
BEGIN
  -- 1. Lock procurement record, booking, request, and queue entry
  SELECT 
    pr.id,
    pr.booking_id,
    pr.farmer_id,
    pr.centre_id,
    pr.crop_id,
    pr.status,
    pr.total_amount,
    b.procurement_request_id,
    qe.id as queue_entry_id
  INTO v_record
  FROM procurement_records pr
  JOIN bookings b ON b.id = pr.booking_id
  LEFT JOIN queue_entries qe ON qe.booking_id = b.id
  WHERE pr.id = p_procurement_record_id
  FOR UPDATE OF pr;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Procurement record ID % not found', p_procurement_record_id;
  END IF;

  -- 2. Idempotent check: if already completed, fetch existing payment and return
  IF v_record.status = 'PROCUREMENT_COMPLETED' THEN
    SELECT * INTO v_payment
    FROM payments
    WHERE procurement_record_id = p_procurement_record_id;

    SELECT jsonb_build_object(
      'procurement_record', to_jsonb(pr.*),
      'payment', to_jsonb(v_payment.*),
      'already_completed', true
    ) INTO v_result
    FROM procurement_records pr
    WHERE pr.id = p_procurement_record_id;

    RETURN v_result;
  END IF;

  -- 3. Verify procurement status is ACCEPTED
  IF v_record.status != 'ACCEPTED' THEN
    RAISE EXCEPTION 'Procurement record status must be ACCEPTED for completion. Current status: %', v_record.status;
  END IF;

  -- 4. Update procurement_records status to PROCUREMENT_COMPLETED
  UPDATE procurement_records
  SET status = 'PROCUREMENT_COMPLETED',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_procurement_record_id;

  -- 5. Update bookings status to COMPLETED
  UPDATE bookings
  SET status = 'COMPLETED',
      updated_at = NOW()
  WHERE id = v_record.booking_id;

  -- 6. Update procurement_requests status to COMPLETED
  UPDATE procurement_requests
  SET status = 'COMPLETED',
      updated_at = NOW()
  WHERE id = v_record.procurement_request_id;

  -- 7. Update queue_entries status to COMPLETED (if entry exists)
  IF v_record.queue_entry_id IS NOT NULL THEN
    UPDATE queue_entries
    SET status = 'COMPLETED',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_record.queue_entry_id;

    -- Emits SERVICE_COMPLETED event in queue_events
    INSERT INTO queue_events (
      queue_entry_id,
      event_type,
      metadata
    ) VALUES (
      v_record.queue_entry_id,
      'SERVICE_COMPLETED',
      jsonb_build_object('completed_by', p_completed_by, 'notes', p_notes)
    );
  END IF;

  -- 8. Generate unique payment reference and insert into payments table
  v_payment_ref := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(p_procurement_record_id::text FROM 1 FOR 6));

  INSERT INTO payments (
    payment_reference,
    procurement_record_id,
    farmer_id,
    amount,
    status,
    payment_method
  ) VALUES (
    v_payment_ref,
    p_procurement_record_id,
    v_record.farmer_id,
    COALESCE(v_record.total_amount, 0.00),
    'PENDING',
    'BANK_TRANSFER'
  )
  ON CONFLICT (procurement_record_id) DO NOTHING
  RETURNING * INTO v_payment;

  IF v_payment.id IS NULL THEN
    SELECT * INTO v_payment
    FROM payments
    WHERE procurement_record_id = p_procurement_record_id;
  END IF;

  -- 9. Construct final result JSONB
  SELECT jsonb_build_object(
    'procurement_record', to_jsonb(pr.*),
    'payment', to_jsonb(v_payment.*),
    'already_completed', false
  ) INTO v_result
  FROM procurement_records pr
  WHERE pr.id = p_procurement_record_id;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION fn_complete_procurement(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_complete_procurement(UUID, UUID, TEXT) TO service_role;
