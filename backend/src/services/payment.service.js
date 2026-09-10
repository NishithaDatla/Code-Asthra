import supabase from '../config/supabase.js';

/**
 * Helper to fetch active centre assignment for staff/admin user
 */
export async function getStaffCentreId(user) {
  if (user.role === 'SYSTEM_ADMIN') return null;

  const { data: staff, error } = await supabase
    .from('centre_staff')
    .select('centre_id')
    .eq('user_id', user.db_id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !staff) {
    const err = new Error('Staff is not assigned to any active procurement centre.');
    err.statusCode = 403;
    throw err;
  }

  return staff.centre_id;
}

/**
 * Retrieves a payment record by payment ID or procurement record ID with authorization checks.
 */
export async function getPaymentByIdOrProcurement(user, identifier) {
  if (!identifier) {
    const err = new Error('Payment ID or Procurement Record ID is required');
    err.statusCode = 400;
    throw err;
  }

  // 1. Try fetching payment directly by payment ID or by procurement_record_id
  let { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .or(`id.eq.${identifier},procurement_record_id.eq.${identifier}`)
    .maybeSingle();

  if (error || !payment) {
    const err = new Error('Payment record not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Authorization Checks
  if (user.role === 'FARMER') {
    if (payment.farmer_id !== user.farmer_id) {
      const err = new Error('Payment record not found.');
      err.statusCode = 404;
      throw err;
    }
  } else if (user.role === 'CENTRE_STAFF' || user.role === 'CENTRE_ADMIN') {
    const staffCentreId = await getStaffCentreId(user);

    // Verify centre ownership through procurement_records
    const { data: pRec } = await supabase
      .from('procurement_records')
      .select('centre_id')
      .eq('id', payment.procurement_record_id)
      .maybeSingle();

    if (!pRec || pRec.centre_id !== staffCentreId) {
      const err = new Error('Payment record not found.');
      err.statusCode = 404;
      throw err;
    }
  }

  return payment;
}

/**
 * Updates payment status using atomic RPC mutation with valid state transitions.
 */
export async function updatePaymentStatus(user, paymentId, payload = {}) {
  if (user.role === 'FARMER') {
    const err = new Error('Farmers are not authorized to update payment status');
    err.statusCode = 403;
    throw err;
  }

  // 1. Verify existence & centre isolation
  const existingPayment = await getPaymentByIdOrProcurement(user, paymentId);

  const currentStatus = existingPayment.status;
  const targetStatus = payload.status;

  // 2. Validate state machine transitions
  if (currentStatus === 'COMPLETED' || currentStatus === 'FAILED') {
    const err = new Error(`Payment is in terminal state ${currentStatus} and cannot be updated`);
    err.statusCode = 400;
    throw err;
  }

  if (currentStatus === 'PENDING') {
    if (targetStatus !== 'PROCESSING' && targetStatus !== 'FAILED') {
      const err = new Error(`Invalid payment status transition from PENDING to ${targetStatus}`);
      err.statusCode = 400;
      throw err;
    }
  } else if (currentStatus === 'PROCESSING') {
    if (targetStatus !== 'COMPLETED' && targetStatus !== 'FAILED') {
      const err = new Error(`Invalid payment status transition from PROCESSING to ${targetStatus}`);
      err.statusCode = 400;
      throw err;
    }
  }

  // 3. Perform atomic status update via RPC (with application fallback)
  let updatedPayment = null;
  const { data: rpcResult, error: rpcErr } = await supabase.rpc('fn_update_payment_status', {
    p_payment_id: existingPayment.id,
    p_target_status: targetStatus,
    p_transaction_id: payload.transaction_id || null,
    p_updated_by: user.db_id
  });

  if (rpcErr && rpcErr.code !== 'PGRST202') {
    const err = new Error(`Payment status update failed: ${rpcErr.message}`);
    err.statusCode = rpcErr.code === 'P0001' ? 400 : 500;
    throw err;
  }

  if (rpcResult) {
    updatedPayment = rpcResult;
  } else {
    // Application-level fallback for DB schema caching resilience
    const now = new Date().toISOString();
    const updateData = {
      status: targetStatus,
      updated_at: now
    };

    if (targetStatus === 'COMPLETED') {
      updateData.processed_at = now;
      if (payload.transaction_id) {
        updateData.transaction_id = payload.transaction_id;
      }
    }

    const { data: fallbackData, error: updateErr } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', existingPayment.id)
      .select()
      .single();

    if (updateErr || !fallbackData) {
      const err = new Error(`Failed to update payment status: ${updateErr?.message || 'Unknown DB error'}`);
      err.statusCode = 400;
      throw err;
    }

    updatedPayment = fallbackData;
  }

  // 4. Trigger Notification AFTER database update succeeds
  if (targetStatus === 'COMPLETED') {
    try {
      const { triggerNotification, NOTIFICATION_EVENT_TYPES } = await import('./notification.service.js');
      triggerNotification(NOTIFICATION_EVENT_TYPES.PAYMENT_PROCESSED, {
        userId: user.id,
        farmerId: updatedPayment.farmer_id,
        paymentReference: updatedPayment.payment_reference,
        amount: updatedPayment.amount,
        referenceId: updatedPayment.id
      }).catch(err => console.warn('[Payment Notification Warning]:', err.message));
    } catch (nErr) {
      console.warn('[Payment Notification Module Import Warning]:', nErr.message);
    }
  }

  return updatedPayment;
}

export default {
  getStaffCentreId,
  getPaymentByIdOrProcurement,
  updatePaymentStatus
};
