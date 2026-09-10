-- SIH 26032 Smart Procurement Flow Management System
-- Migration: 20260910160000_add_payment_status_rpc.sql
-- Description: Atomic Payment Status State Machine Database RPC Function

CREATE OR REPLACE FUNCTION fn_update_payment_status(
  p_payment_id UUID,
  p_target_status payment_status_enum,
  p_transaction_id VARCHAR(100) DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment RECORD;
  v_updated_payment RECORD;
BEGIN
  -- 1. Lock payment row for update
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment ID % not found', p_payment_id;
  END IF;

  -- 2. Enforce Terminal State Rules
  IF v_payment.status = 'COMPLETED' OR v_payment.status = 'FAILED' THEN
    RAISE EXCEPTION 'Payment is in terminal state % and cannot be updated', v_payment.status;
  END IF;

  -- 3. Enforce Valid State Machine Transitions
  -- Valid: PENDING -> PROCESSING, PENDING -> FAILED
  -- Valid: PROCESSING -> COMPLETED, PROCESSING -> FAILED
  IF v_payment.status = 'PENDING' AND p_target_status NOT IN ('PROCESSING', 'FAILED') THEN
    RAISE EXCEPTION 'Invalid payment status transition from PENDING to %', p_target_status;
  END IF;

  IF v_payment.status = 'PROCESSING' AND p_target_status NOT IN ('COMPLETED', 'FAILED') THEN
    RAISE EXCEPTION 'Invalid payment status transition from PROCESSING to %', p_target_status;
  END IF;

  -- 4. Perform Update
  IF p_target_status = 'COMPLETED' THEN
    UPDATE payments
    SET status = 'COMPLETED',
        processed_at = NOW(),
        transaction_id = COALESCE(TRIM(p_transaction_id), transaction_id),
        updated_at = NOW()
    WHERE id = p_payment_id
    RETURNING * INTO v_updated_payment;
  ELSE
    UPDATE payments
    SET status = p_target_status,
        updated_at = NOW()
    WHERE id = p_payment_id
    RETURNING * INTO v_updated_payment;
  END IF;

  -- 5. Return updated payment as JSONB
  RETURN to_jsonb(v_updated_payment);
END;
$$;

REVOKE EXECUTE ON FUNCTION fn_update_payment_status(UUID, payment_status_enum, VARCHAR, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_update_payment_status(UUID, payment_status_enum, VARCHAR, UUID) TO service_role;
