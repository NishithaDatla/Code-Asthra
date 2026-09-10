-- ============================================================================
-- MIGRATION: 20260910140000_create_booking_transactions.sql
-- DESCRIPTION: Transactional database functions for Phase 5F Booking Management.
-- Provides strict row-level locking (SELECT ... FOR UPDATE) and atomic consistency across
-- bookings, slots, and procurement_requests.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE BOOKING TRANSACTION (POST /api/bookings)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_booking_transaction(
    p_auth_user_id UUID,
    p_procurement_request_id UUID,
    p_slot_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_farmer_id UUID;
    v_proc_req RECORD;
    v_slot RECORD;
    v_centre RECORD;
    v_requested_qty NUMERIC(10, 2);
    v_max_cap NUMERIC(10, 2);
    v_booked_cap NUMERIC(10, 2);
    v_max_farmers INT;
    v_booked_farmers INT;
    v_booking_ref VARCHAR(50);
    v_new_booking RECORD;
BEGIN
    -- Step 1: Resolve authenticated user & farmer identity
    SELECT id INTO v_user_id
    FROM users
    WHERE auth_id = p_auth_user_id AND role = 'FARMER' AND is_active = true;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_FARMER';
    END IF;

    SELECT id INTO v_farmer_id
    FROM farmers
    WHERE user_id = v_user_id;

    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_FARMER';
    END IF;

    -- Step 2: Fetch and verify procurement request ownership & eligibility
    SELECT * INTO v_proc_req
    FROM procurement_requests
    WHERE id = p_procurement_request_id AND farmer_id = v_farmer_id
    FOR UPDATE;

    IF v_proc_req.id IS NULL THEN
        RAISE EXCEPTION 'REQUEST_NOT_FOUND';
    END IF;

    IF v_proc_req.status <> 'SUBMITTED' THEN
        RAISE EXCEPTION 'REQUEST_NOT_ELIGIBLE';
    END IF;

    v_requested_qty := v_proc_req.estimated_quantity_quintals;

    -- Step 3: Lock slot row and verify active state & centre status
    SELECT s.* INTO v_slot
    FROM slots s
    WHERE s.id = p_slot_id AND s.is_active = true
    FOR UPDATE;

    IF v_slot.id IS NULL THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND_OR_INACTIVE';
    END IF;

    SELECT * INTO v_centre
    FROM procurement_centres
    WHERE id = v_slot.centre_id;

    IF v_centre.id IS NULL OR v_centre.status <> 'OPEN' THEN
        RAISE EXCEPTION 'CENTRE_UNAVAILABLE';
    END IF;

    -- Step 4: Check capacity & farmer limits under row lock
    v_max_cap := v_slot.max_capacity_quintals;
    v_booked_cap := v_slot.booked_capacity_quintals;
    v_max_farmers := v_slot.max_farmers;
    v_booked_farmers := v_slot.booked_farmers;

    IF (v_booked_cap + v_requested_qty > v_max_cap) OR (v_booked_farmers + 1 > v_max_farmers) THEN
        RAISE EXCEPTION 'INSUFFICIENT_CAPACITY';
    END IF;

    -- Step 5: Generate collision-safe booking reference
    v_booking_ref := 'BKG-' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 6) || '-' || (floor(1000 + random() * 9000))::text;

    -- Step 6: Create booking record
    INSERT INTO bookings (
        booking_reference,
        farmer_id,
        procurement_request_id,
        slot_id,
        quantity_quintals,
        status
    )
    VALUES (
        v_booking_ref,
        v_farmer_id,
        p_procurement_request_id,
        p_slot_id,
        v_requested_qty,
        'CONFIRMED'
    )
    RETURNING * INTO v_new_booking;

    -- Step 7: Increment slot capacity and booked farmers count
    UPDATE slots
    SET
        booked_capacity_quintals = booked_capacity_quintals + v_requested_qty,
        booked_farmers = booked_farmers + 1,
        updated_at = NOW()
    WHERE id = p_slot_id;

    -- Step 8: Update procurement request status to SLOT_BOOKED
    UPDATE procurement_requests
    SET
        status = 'SLOT_BOOKED',
        updated_at = NOW()
    WHERE id = p_procurement_request_id;

    -- Step 9: Return structured response matching approved contract
    RETURN jsonb_build_object(
        'id', v_new_booking.id,
        'booking_reference', v_new_booking.booking_reference,
        'procurement_request_id', v_new_booking.procurement_request_id,
        'slot_id', v_new_booking.slot_id,
        'quantity_quintals', v_new_booking.quantity_quintals,
        'status', v_new_booking.status,
        'created_at', v_new_booking.created_at,
        'slot', jsonb_build_object(
            'slot_date', v_slot.slot_date,
            'start_time', v_slot.start_time,
            'end_time', v_slot.end_time
        ),
        'centre', jsonb_build_object(
            'id', v_centre.id,
            'name', v_centre.name,
            'district', v_centre.district
        )
    );
EXCEPTION
    WHEN UNIQUE_VIOLATION THEN
        RAISE EXCEPTION 'DUPLICATE_ACTIVE_BOOKING';
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. RESCHEDULE BOOKING TRANSACTION (PUT /api/bookings/:id/reschedule)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reschedule_booking_transaction(
    p_auth_user_id UUID,
    p_booking_id UUID,
    p_new_slot_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_farmer_id UUID;
    v_booking RECORD;
    v_old_slot RECORD;
    v_new_slot RECORD;
    v_new_centre RECORD;
    v_qty NUMERIC(10, 2);
    v_updated_booking RECORD;
BEGIN
    -- Step 1: Resolve authenticated user & farmer identity
    SELECT id INTO v_user_id
    FROM users
    WHERE auth_id = p_auth_user_id AND role = 'FARMER' AND is_active = true;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_FARMER';
    END IF;

    SELECT id INTO v_farmer_id
    FROM farmers
    WHERE user_id = v_user_id;

    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_FARMER';
    END IF;

    -- Step 2: Fetch and lock existing booking
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id AND farmer_id = v_farmer_id
    FOR UPDATE;

    IF v_booking.id IS NULL THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    IF v_booking.status NOT IN ('CONFIRMED', 'PENDING') THEN
        RAISE EXCEPTION 'BOOKING_NOT_RESCHEDULABLE';
    END IF;

    -- If same slot requested, fetch details and return
    IF v_booking.slot_id = p_new_slot_id THEN
        SELECT s.*, c.id AS c_id, c.name AS c_name, c.district AS c_district
        INTO v_old_slot
        FROM slots s
        JOIN procurement_centres c ON c.id = s.centre_id
        WHERE s.id = v_booking.slot_id;

        RETURN jsonb_build_object(
            'id', v_booking.id,
            'booking_reference', v_booking.booking_reference,
            'procurement_request_id', v_booking.procurement_request_id,
            'slot_id', v_booking.slot_id,
            'quantity_quintals', v_booking.quantity_quintals,
            'status', v_booking.status,
            'updated_at', v_booking.updated_at,
            'slot', jsonb_build_object(
                'slot_date', v_old_slot.slot_date,
                'start_time', v_old_slot.start_time,
                'end_time', v_old_slot.end_time
            ),
            'centre', jsonb_build_object(
                'id', v_old_slot.c_id,
                'name', v_old_slot.c_name,
                'district', v_old_slot.c_district
            )
        );
    END IF;

    -- Step 3: Lock old slot and new slot in deterministic order to prevent deadlocks
    IF v_booking.slot_id < p_new_slot_id THEN
        PERFORM 1 FROM slots WHERE id = v_booking.slot_id FOR UPDATE;
        SELECT s.* INTO v_new_slot FROM slots s WHERE s.id = p_new_slot_id AND s.is_active = true FOR UPDATE;
    ELSE
        SELECT s.* INTO v_new_slot FROM slots s WHERE s.id = p_new_slot_id AND s.is_active = true FOR UPDATE;
        PERFORM 1 FROM slots WHERE id = v_booking.slot_id FOR UPDATE;
    END IF;

    IF v_new_slot.id IS NULL THEN
        RAISE EXCEPTION 'NEW_SLOT_NOT_FOUND_OR_INACTIVE';
    END IF;

    -- Step 4: Verify new centre status
    SELECT * INTO v_new_centre
    FROM procurement_centres
    WHERE id = v_new_slot.centre_id;

    IF v_new_centre.id IS NULL OR v_new_centre.status <> 'OPEN' THEN
        RAISE EXCEPTION 'NEW_CENTRE_UNAVAILABLE';
    END IF;

    v_qty := v_booking.quantity_quintals;

    -- Step 5: Check new slot capacity
    IF (v_new_slot.booked_capacity_quintals + v_qty > v_new_slot.max_capacity_quintals) OR
       (v_new_slot.booked_farmers + 1 > v_new_slot.max_farmers) THEN
        RAISE EXCEPTION 'NEW_SLOT_INSUFFICIENT_CAPACITY';
    END IF;

    -- Step 6: Reserve capacity on new slot
    UPDATE slots
    SET
        booked_capacity_quintals = booked_capacity_quintals + v_qty,
        booked_farmers = booked_farmers + 1,
        updated_at = NOW()
    WHERE id = p_new_slot_id;

    -- Step 7: Update booking record to point to new slot
    UPDATE bookings
    SET
        slot_id = p_new_slot_id,
        updated_at = NOW()
    WHERE id = p_booking_id
    RETURNING * INTO v_updated_booking;

    -- Step 8: Release capacity on old slot
    UPDATE slots
    SET
        booked_capacity_quintals = GREATEST(0, booked_capacity_quintals - v_qty),
        booked_farmers = GREATEST(0, booked_farmers - 1),
        updated_at = NOW()
    WHERE id = v_booking.slot_id;

    -- Step 9: Return updated booking response
    RETURN jsonb_build_object(
        'id', v_updated_booking.id,
        'booking_reference', v_updated_booking.booking_reference,
        'procurement_request_id', v_updated_booking.procurement_request_id,
        'slot_id', v_updated_booking.slot_id,
        'quantity_quintals', v_updated_booking.quantity_quintals,
        'status', v_updated_booking.status,
        'updated_at', v_updated_booking.updated_at,
        'slot', jsonb_build_object(
            'slot_date', v_new_slot.slot_date,
            'start_time', v_new_slot.start_time,
            'end_time', v_new_slot.end_time
        ),
        'centre', jsonb_build_object(
            'id', v_new_centre.id,
            'name', v_new_centre.name,
            'district', v_new_centre.district
        )
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 3. CANCEL BOOKING TRANSACTION (DELETE /api/bookings/:id)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_booking_transaction(
    p_auth_user_id UUID,
    p_booking_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_farmer_id UUID;
    v_booking RECORD;
    v_qty NUMERIC(10, 2);
    v_cancelled_booking RECORD;
BEGIN
    -- Step 1: Resolve authenticated user & farmer identity
    SELECT id INTO v_user_id
    FROM users
    WHERE auth_id = p_auth_user_id AND role = 'FARMER' AND is_active = true;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_FARMER';
    END IF;

    SELECT id INTO v_farmer_id
    FROM farmers
    WHERE user_id = v_user_id;

    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_FARMER';
    END IF;

    -- Step 2: Fetch and lock existing booking
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id AND farmer_id = v_farmer_id
    FOR UPDATE;

    IF v_booking.id IS NULL THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    IF v_booking.status NOT IN ('CONFIRMED', 'PENDING') THEN
        RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE';
    END IF;

    v_qty := v_booking.quantity_quintals;

    -- Step 3: Lock slot row
    PERFORM 1 FROM slots WHERE id = v_booking.slot_id FOR UPDATE;

    -- Step 4: Logical cancellation - update booking status to CANCELLED
    UPDATE bookings
    SET
        status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_booking_id
    RETURNING * INTO v_cancelled_booking;

    -- Step 5: Release slot capacity
    UPDATE slots
    SET
        booked_capacity_quintals = GREATEST(0, booked_capacity_quintals - v_qty),
        booked_farmers = GREATEST(0, booked_farmers - 1),
        updated_at = NOW()
    WHERE id = v_booking.slot_id;

    -- Step 6: Revert procurement request status back to SUBMITTED
    UPDATE procurement_requests
    SET
        status = 'SUBMITTED',
        updated_at = NOW()
    WHERE id = v_booking.procurement_request_id;

    -- Step 7: Return cancellation result
    RETURN jsonb_build_object(
        'id', v_cancelled_booking.id,
        'booking_reference', v_cancelled_booking.booking_reference,
        'procurement_request_id', v_cancelled_booking.procurement_request_id,
        'slot_id', v_cancelled_booking.slot_id,
        'status', v_cancelled_booking.status,
        'updated_at', v_cancelled_booking.updated_at
    );
END;
$$;
