import { supabase } from '../config/supabase.js';

/**
 * Resolves centre_id for a CENTRE_STAFF or CENTRE_ADMIN user.
 */
export async function getStaffCentreId(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from('centre_staff')
    .select('centre_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  return data?.centre_id || null;
}

/**
 * Retrieves a single procurement record by ID or booking_id, enforcing role & centre ownership.
 */
export async function getProcurementRecord(user, recordOrBookingId) {
  if (!recordOrBookingId) {
    const err = new Error('Procurement or booking ID is required.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Fetch record by primary ID or booking_id
  const { data: record, error: fetchErr } = await supabase
    .from('procurement_records')
    .select('*, booking:bookings(booking_reference, procurement_request_id), farmer:farmers(user_id, farmer_code), centre:procurement_centres(name, centre_code), crop:crops(name, crop_code, msp_per_quintal)')
    .or(`id.eq.${recordOrBookingId},booking_id.eq.${recordOrBookingId}`)
    .maybeSingle();

  if (fetchErr || !record) {
    const err = new Error('Procurement record not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Role & Centre RBAC checks
  if (user.role === 'FARMER') {
    if (!user.farmer_id || record.farmer_id !== user.farmer_id) {
      const err = new Error('Procurement record not found.');
      err.statusCode = 404;
      throw err;
    }
  } else if (user.role === 'CENTRE_STAFF' || user.role === 'CENTRE_ADMIN') {
    const staffCentreId = await getStaffCentreId(user.db_id);
    if (!staffCentreId || staffCentreId !== record.centre_id) {
      const err = new Error('Forbidden. Staff can only access procurement records for their assigned centre.');
      err.statusCode = 403;
      throw err;
    }
  }

  // 3. Fetch latest quality check & payment details
  const { data: qualityCheck } = await supabase
    .from('quality_checks')
    .select('*')
    .eq('procurement_record_id', record.id)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('procurement_record_id', record.id)
    .maybeSingle();

  return {
    ...record,
    quality_check: qualityCheck || null,
    payment: payment || null
  };
}

/**
 * Submits quality inspection parameters and determines PASSED / FAILED status.
 */
export async function submitQualityCheck(user, recordOrBookingId, payload) {
  const record = await getProcurementRecord(user, recordOrBookingId);

  if (record.status !== 'CHECKED_IN' && record.status !== 'VERIFICATION') {
    const err = new Error(`Procurement record status must be CHECKED_IN or VERIFICATION for quality check. Current status: ${record.status}`);
    err.statusCode = 400;
    throw err;
  }

  // Strict binary quality rule:
  // moisture <= 14.0 AND foreign_matter <= 2.0 AND damaged_grains <= 4.0 -> PASSED
  const isPassed =
    payload.moisture_content_pct <= 14.0 &&
    payload.foreign_matter_pct <= 2.0 &&
    payload.damaged_grains_pct <= 4.0;

  const qualityStatus = isPassed ? 'PASSED' : 'FAILED';
  const targetProcurementStatus = isPassed ? 'WEIGHING' : 'REJECTED';

  // Insert quality_checks record
  const { data: qCheck, error: qErr } = await supabase
    .from('quality_checks')
    .insert({
      procurement_record_id: record.id,
      inspector_id: user.db_id,
      moisture_content_pct: payload.moisture_content_pct,
      foreign_matter_pct: payload.foreign_matter_pct,
      damaged_grains_pct: payload.damaged_grains_pct,
      status: qualityStatus,
      remarks: payload.remarks || null
    })
    .select()
    .single();

  if (qErr || !qCheck) {
    const err = new Error(`Failed to submit quality check: ${qErr?.message || 'Unknown error'}`);
    err.statusCode = 400;
    throw err;
  }

  // Update procurement_records status & verified_at
  const { data: updatedRecord, error: updateErr } = await supabase
    .from('procurement_records')
    .update({
      status: targetProcurementStatus,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', record.id)
    .select()
    .single();

  if (updateErr || !updatedRecord) {
    const err = new Error(`Failed to update procurement record status: ${updateErr?.message || 'Unknown error'}`);
    err.statusCode = 400;
    throw err;
  }

  return {
    procurement_record: updatedRecord,
    quality_check: qCheck
  };
}

/**
 * Submits digital scale gross and tare weight calculations.
 */
export async function submitWeighing(user, recordOrBookingId, payload) {
  const record = await getProcurementRecord(user, recordOrBookingId);

  if (record.status !== 'QUALITY_CHECK' && record.status !== 'WEIGHING') {
    const err = new Error(`Procurement record status must be QUALITY_CHECK or WEIGHING for weighing. Current status: ${record.status}`);
    err.statusCode = 400;
    throw err;
  }

  if (payload.gross_weight_quintals <= payload.tare_weight_quintals) {
    const err = new Error('Gross weight must be greater than tare weight.');
    err.statusCode = 400;
    throw err;
  }

  const netWeight = payload.gross_weight_quintals - payload.tare_weight_quintals;

  // Fetch crop MSP
  const { data: crop } = await supabase
    .from('crops')
    .select('msp_per_quintal')
    .eq('id', record.crop_id)
    .single();

  const rate = Number(crop?.msp_per_quintal || record.crop?.msp_per_quintal || 0);
  const totalAmount = Number((netWeight * rate).toFixed(2));

  // Update procurement_records weights, MSP rate, total amount, and transition status to ACCEPTED
  const { data: updatedRecord, error: updateErr } = await supabase
    .from('procurement_records')
    .update({
      gross_weight_quintals: payload.gross_weight_quintals,
      tare_weight_quintals: payload.tare_weight_quintals,
      net_weight_quintals: netWeight,
      rate_per_quintal: rate,
      total_amount: totalAmount,
      status: 'ACCEPTED',
      updated_at: new Date().toISOString()
    })
    .eq('id', record.id)
    .select()
    .single();

  if (updateErr || !updatedRecord) {
    const err = new Error(`Failed to update weighing details: ${updateErr?.message || 'Unknown error'}`);
    err.statusCode = 400;
    throw err;
  }

  return updatedRecord;
}

/**
 * Finalizes procurement batch, updating bookings, requests, queue entries, and generating payments atomically via RPC.
 */
export async function completeProcurement(user, recordOrBookingId, payload = {}) {
  const record = await getProcurementRecord(user, recordOrBookingId);

  if (record.status !== 'ACCEPTED' && record.status !== 'PROCUREMENT_COMPLETED') {
    const err = new Error(`Procurement record status must be ACCEPTED for completion. Current status: ${record.status}`);
    err.statusCode = 400;
    throw err;
  }

  // 1. Invoke atomic PL/pgSQL RPC transaction
  let rpcResult = null;
  const { data: result, error: rpcErr } = await supabase.rpc('fn_complete_procurement', {
    p_procurement_record_id: record.id,
    p_completed_by: user.db_id,
    p_notes: payload?.notes || null
  });

  if (rpcErr && rpcErr.code !== 'PGRST202') {
    const err = new Error(`Procurement completion transaction failed: ${rpcErr.message}`);
    err.statusCode = rpcErr.code === 'P0001' ? 400 : 500;
    throw err;
  }

  if (result) {
    rpcResult = result;
  } else {
    // Application-level fallback transaction when RPC is not in schema cache
    if (record.status === 'PROCUREMENT_COMPLETED') {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('procurement_record_id', record.id)
        .maybeSingle();

      rpcResult = {
        procurement_record: record,
        payment: existingPayment,
        already_completed: true
      };
    } else {
      const now = new Date().toISOString();

      // Update procurement_records
      const { data: updatedRecord, error: pErr } = await supabase
        .from('procurement_records')
        .update({ status: 'PROCUREMENT_COMPLETED', completed_at: now, updated_at: now })
        .eq('id', record.id)
        .select()
        .single();

      if (pErr) throw new Error(`Completion failed: ${pErr.message}`);

      // Update bookings
      await supabase.from('bookings').update({ status: 'COMPLETED', updated_at: now }).eq('id', record.booking_id);

      // Update procurement_requests
      const { data: bData } = await supabase.from('bookings').select('procurement_request_id').eq('id', record.booking_id).single();
      if (bData?.procurement_request_id) {
        await supabase.from('procurement_requests').update({ status: 'COMPLETED', updated_at: now }).eq('id', bData.procurement_request_id);
      }

      // Update queue_entries & queue_events
      const { data: qeData } = await supabase.from('queue_entries').select('id').eq('booking_id', record.booking_id).maybeSingle();
      if (qeData?.id) {
        await supabase.from('queue_entries').update({ status: 'COMPLETED', completed_at: now, updated_at: now }).eq('id', qeData.id);
        await supabase.from('queue_events').insert({
          queue_entry_id: qeData.id,
          event_type: 'SERVICE_COMPLETED',
          metadata: { completed_by: user.db_id, notes: payload?.notes || null }
        });
      }

      // Create Payment
      const payRef = `PAY-${now.slice(0, 10).replace(/-/g, '')}-${record.id.slice(0, 6).toUpperCase()}`;
      let paymentRecord = null;

      const { data: existingPay } = await supabase.from('payments').select('*').eq('procurement_record_id', record.id).maybeSingle();

      if (existingPay) {
        paymentRecord = existingPay;
      } else {
        const { data: newPay } = await supabase
          .from('payments')
          .insert({
            payment_reference: payRef,
            procurement_record_id: record.id,
            farmer_id: record.farmer_id,
            amount: Number(record.total_amount || 0.00),
            status: 'PENDING',
            payment_method: 'BANK_TRANSFER'
          })
          .select()
          .single();
        paymentRecord = newPay;
      }

      rpcResult = {
        procurement_record: updatedRecord,
        payment: paymentRecord,
        already_completed: false
      };
    }
  }

  // 2. Trigger notification AFTER successful transaction commit
  try {
    const notificationModule = await import('./notification.service.js');
    const notificationService = notificationModule.default || notificationModule;
    const { NOTIFICATION_EVENT_TYPES } = notificationModule;

    notificationService.triggerNotification(NOTIFICATION_EVENT_TYPES.SERVICE_COMPLETED, {
      userId: user.id,
      farmerId: record.farmer_id,
      procurementRecordId: record.id,
      amount: rpcResult.payment?.amount || record.total_amount
    }).catch(err => console.warn('[Procurement Notification Non-blocking Warning]:', err.message));
  } catch (notifErr) {
    console.warn('[Procurement Notification Module Import Warning]:', notifErr.message);
  }

  return rpcResult;
}

export default {
  getStaffCentreId,
  getProcurementRecord,
  submitQualityCheck,
  submitWeighing,
  completeProcurement
};
