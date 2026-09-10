import { supabase } from '../config/supabase.js';

/**
 * Maps database RPC internal exception codes to clean client-facing messages.
 */
function mapRpcErrorToClientMessage(rawMessage) {
  if (!rawMessage) return 'An unexpected error occurred.';

  if (rawMessage.includes('UNAUTHORIZED_FARMER')) {
    return 'User is not authorized as a farmer.';
  }
  if (rawMessage.includes('REQUEST_NOT_FOUND')) {
    return 'Procurement request not found.';
  }
  if (rawMessage.includes('REQUEST_NOT_ELIGIBLE')) {
    return 'Procurement request is not eligible for booking.';
  }
  if (rawMessage.includes('SLOT_NOT_FOUND_OR_INACTIVE')) {
    return 'Slot not found or is inactive.';
  }
  if (rawMessage.includes('CENTRE_UNAVAILABLE')) {
    return 'Procurement centre is closed or unavailable.';
  }
  if (rawMessage.includes('INSUFFICIENT_CAPACITY')) {
    return 'Slot does not have sufficient capacity or farmer slots available.';
  }
  if (rawMessage.includes('DUPLICATE_ACTIVE_BOOKING') || rawMessage.includes('uq_active_request_booking') || rawMessage.includes('23505')) {
    return 'This procurement request already has an active booking.';
  }
  if (rawMessage.includes('BOOKING_NOT_FOUND')) {
    return 'Booking not found.';
  }
  if (rawMessage.includes('BOOKING_NOT_RESCHEDULABLE')) {
    return 'Booking cannot be rescheduled in its current status.';
  }
  if (rawMessage.includes('NEW_SLOT_NOT_FOUND_OR_INACTIVE')) {
    return 'New slot not found or is inactive.';
  }
  if (rawMessage.includes('NEW_CENTRE_UNAVAILABLE')) {
    return 'New procurement centre is closed or unavailable.';
  }
  if (rawMessage.includes('NEW_SLOT_INSUFFICIENT_CAPACITY')) {
    return 'New slot does not have sufficient capacity.';
  }
  if (rawMessage.includes('BOOKING_NOT_CANCELLABLE')) {
    return 'Booking cannot be cancelled in its current status.';
  }

  return rawMessage;
}

/**
 * Helper to fetch authenticated user & farmer profile details.
 */
export async function getAuthenticatedFarmer(authUserId) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single();

  if (userError || !userData || userData.role !== 'FARMER') {
    return { user: userData || null, farmer: null };
  }

  const { data: farmerData } = await supabase
    .from('farmers')
    .select('*')
    .eq('user_id', userData.id)
    .maybeSingle();

  return {
    user: userData,
    farmer: farmerData
  };
}

/**
 * Create Booking (POST /api/bookings)
 * Attempts PostgreSQL RPC transaction (create_booking_transaction) first.
 * Falls back to atomic conditional update with compensating rollback if RPC is not yet compiled.
 */
export async function createBooking(authUserId, payload) {
  // 1. Try PostgreSQL RPC transaction
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_booking_transaction', {
    p_auth_user_id: authUserId,
    p_procurement_request_id: payload.procurement_request_id,
    p_slot_id: payload.slot_id
  });

  if (!rpcError) {
    return rpcData;
  }

  if (rpcError.code !== 'PGRST202') {
    const message = mapRpcErrorToClientMessage(rpcError.message);
    throw new Error(message);
  }

  // 2. Application-level atomic fallback
  const { user, farmer } = await getAuthenticatedFarmer(authUserId);

  if (!user || user.role !== 'FARMER') {
    throw new Error('User is not authorized as a farmer.');
  }

  if (!farmer) {
    throw new Error('Farmer profile not found for authenticated user.');
  }

  const { data: request, error: reqError } = await supabase
    .from('procurement_requests')
    .select('*')
    .eq('id', payload.procurement_request_id)
    .eq('farmer_id', farmer.id)
    .maybeSingle();

  if (reqError || !request) {
    throw new Error('Procurement request not found.');
  }

  if (request.status !== 'SUBMITTED') {
    throw new Error('Procurement request is not eligible for booking.');
  }

  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('*')
    .eq('id', payload.slot_id)
    .eq('is_active', true)
    .maybeSingle();

  if (slotError || !slot) {
    throw new Error('Slot not found or is inactive.');
  }

  const { data: centre, error: centreError } = await supabase
    .from('procurement_centres')
    .select('id, name, district, state, status')
    .eq('id', slot.centre_id)
    .maybeSingle();

  if (centreError || !centre || centre.status !== 'OPEN') {
    throw new Error('Procurement centre is closed or unavailable.');
  }

  const requestedQty = Number(request.estimated_quantity_quintals);
  const maxCap = Number(slot.max_capacity_quintals);
  const currentBookedCap = Number(slot.booked_capacity_quintals);
  const newBookedCap = currentBookedCap + requestedQty;

  const maxFarmers = Number(slot.max_farmers);
  const currentBookedFarmers = Number(slot.booked_farmers);
  const newBookedFarmers = currentBookedFarmers + 1;

  if (newBookedCap > maxCap || newBookedFarmers > maxFarmers) {
    throw new Error('Slot does not have sufficient capacity or farmer slots available.');
  }

  const maxAllowedCap = maxCap - requestedQty;
  const maxAllowedFarmers = maxFarmers - 1;

  const { data: updatedSlot, error: slotUpdateErr } = await supabase
    .from('slots')
    .update({
      booked_capacity_quintals: newBookedCap,
      booked_farmers: newBookedFarmers
    })
    .eq('id', slot.id)
    .eq('is_active', true)
    .lte('booked_capacity_quintals', maxAllowedCap)
    .lte('booked_farmers', maxAllowedFarmers)
    .select()
    .maybeSingle();

  if (slotUpdateErr || !updatedSlot) {
    throw new Error('Slot capacity or farmer limit exceeded by concurrent request.');
  }

  let createdBooking = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    const ref = `BKG-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: bData, error: bErr } = await supabase
      .from('bookings')
      .insert({
        booking_reference: ref,
        farmer_id: farmer.id,
        procurement_request_id: request.id,
        slot_id: slot.id,
        quantity_quintals: requestedQty,
        status: 'CONFIRMED'
      })
      .select()
      .single();

    if (!bErr && bData) {
      createdBooking = bData;
      break;
    }

    if (bErr && (bErr.code === '23505' || bErr.message?.includes('uq_active_request_booking'))) {
      await supabase
        .from('slots')
        .update({
          booked_capacity_quintals: currentBookedCap,
          booked_farmers: currentBookedFarmers
        })
        .eq('id', slot.id);
      throw new Error('This procurement request already has an active booking.');
    }

    continue;
  }

  if (!createdBooking) {
    await supabase
      .from('slots')
      .update({
        booked_capacity_quintals: currentBookedCap,
        booked_farmers: currentBookedFarmers
      })
      .eq('id', slot.id);
    throw new Error('This procurement request already has an active booking.');
  }

  const { error: reqUpdateErr } = await supabase
    .from('procurement_requests')
    .update({ status: 'SLOT_BOOKED' })
    .eq('id', request.id);

  if (reqUpdateErr) {
    await supabase.from('bookings').delete().eq('id', createdBooking.id);
    await supabase
      .from('slots')
      .update({
        booked_capacity_quintals: currentBookedCap,
        booked_farmers: currentBookedFarmers
      })
      .eq('id', slot.id);

    throw new Error('Failed to update procurement request status.');
  }

  return {
    id: createdBooking.id,
    booking_reference: createdBooking.booking_reference,
    procurement_request_id: createdBooking.procurement_request_id,
    slot_id: createdBooking.slot_id,
    quantity_quintals: Number(createdBooking.quantity_quintals),
    status: createdBooking.status,
    created_at: createdBooking.created_at,
    slot: {
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time
    },
    centre: {
      id: centre.id,
      name: centre.name,
      district: centre.district
    }
  };
}

/**
 * Reschedule Booking (PUT /api/bookings/:id/reschedule)
 * Attempts PostgreSQL RPC transaction (reschedule_booking_transaction) first.
 * Falls back to atomic conditional update with compensating rollback if RPC is not yet compiled.
 */
export async function rescheduleBooking(authUserId, bookingId, payload) {
  // 1. Try PostgreSQL RPC transaction
  const { data: rpcData, error: rpcError } = await supabase.rpc('reschedule_booking_transaction', {
    p_auth_user_id: authUserId,
    p_booking_id: bookingId,
    p_new_slot_id: payload.new_slot_id
  });

  if (!rpcError) {
    return rpcData;
  }

  if (rpcError.code !== 'PGRST202') {
    const message = mapRpcErrorToClientMessage(rpcError.message);
    throw new Error(message);
  }

  // 2. Application-level atomic fallback
  const { farmer } = await getAuthenticatedFarmer(authUserId);

  if (!farmer) {
    throw new Error('Farmer profile not found for authenticated user.');
  }

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('*, slots!inner(*)')
    .eq('id', bookingId)
    .eq('farmer_id', farmer.id)
    .maybeSingle();

  if (bErr || !booking) {
    throw new Error('Booking not found.');
  }

  if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
    throw new Error('Booking cannot be rescheduled in its current status.');
  }

  if (payload.new_slot_id === booking.slot_id) {
    const { data: centre } = await supabase
      .from('procurement_centres')
      .select('id, name, district')
      .eq('id', booking.slots.centre_id)
      .single();

    return {
      id: booking.id,
      booking_reference: booking.booking_reference,
      procurement_request_id: booking.procurement_request_id,
      slot_id: booking.slot_id,
      quantity_quintals: Number(booking.quantity_quintals),
      status: booking.status,
      updated_at: booking.updated_at,
      slot: {
        slot_date: booking.slots.slot_date,
        start_time: booking.slots.start_time,
        end_time: booking.slots.end_time
      },
      centre: centre || null
    };
  }

  const { data: newSlot, error: newSlotErr } = await supabase
    .from('slots')
    .select('*')
    .eq('id', payload.new_slot_id)
    .eq('is_active', true)
    .maybeSingle();

  if (newSlotErr || !newSlot) {
    throw new Error('New slot not found or is inactive.');
  }

  const { data: newCentre, error: newCentreErr } = await supabase
    .from('procurement_centres')
    .select('id, name, district, status')
    .eq('id', newSlot.centre_id)
    .maybeSingle();

  if (newCentreErr || !newCentre || newCentre.status !== 'OPEN') {
    throw new Error('New procurement centre is closed or unavailable.');
  }

  const qty = Number(booking.quantity_quintals);

  const maxCap = Number(newSlot.max_capacity_quintals);
  const currentBookedCap = Number(newSlot.booked_capacity_quintals);
  const newBookedCap = currentBookedCap + qty;

  const maxFarmers = Number(newSlot.max_farmers);
  const currentBookedFarmers = Number(newSlot.booked_farmers);
  const newBookedFarmers = currentBookedFarmers + 1;

  if (newBookedCap > maxCap || newBookedFarmers > maxFarmers) {
    throw new Error('New slot does not have sufficient capacity.');
  }

  const maxAllowedCap = maxCap - qty;
  const maxAllowedFarmers = maxFarmers - 1;

  const { data: updatedNewSlot, error: updateNewSlotErr } = await supabase
    .from('slots')
    .update({
      booked_capacity_quintals: newBookedCap,
      booked_farmers: newBookedFarmers
    })
    .eq('id', newSlot.id)
    .eq('is_active', true)
    .lte('booked_capacity_quintals', maxAllowedCap)
    .lte('booked_farmers', maxAllowedFarmers)
    .select()
    .maybeSingle();

  if (updateNewSlotErr || !updatedNewSlot) {
    throw new Error('Failed to reserve capacity on new slot.');
  }

  const { data: updatedBooking, error: updateBookingErr } = await supabase
    .from('bookings')
    .update({ slot_id: newSlot.id })
    .eq('id', booking.id)
    .select()
    .single();

  if (updateBookingErr || !updatedBooking) {
    await supabase
      .from('slots')
      .update({
        booked_capacity_quintals: currentBookedCap,
        booked_farmers: currentBookedFarmers
      })
      .eq('id', newSlot.id);
    throw new Error('Failed to update booking to new slot.');
  }

  const { data: oldSlot } = await supabase
    .from('slots')
    .select('*')
    .eq('id', booking.slot_id)
    .maybeSingle();

  if (oldSlot) {
    const releasedCap = Math.max(0, Number(oldSlot.booked_capacity_quintals) - qty);
    const releasedFarmers = Math.max(0, Number(oldSlot.booked_farmers) - 1);
    await supabase
      .from('slots')
      .update({
        booked_capacity_quintals: releasedCap,
        booked_farmers: releasedFarmers
      })
      .eq('id', oldSlot.id);
  }

  return {
    id: updatedBooking.id,
    booking_reference: updatedBooking.booking_reference,
    procurement_request_id: updatedBooking.procurement_request_id,
    slot_id: updatedBooking.slot_id,
    quantity_quintals: Number(updatedBooking.quantity_quintals),
    status: updatedBooking.status,
    updated_at: updatedBooking.updated_at,
    slot: {
      slot_date: newSlot.slot_date,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time
    },
    centre: {
      id: newCentre.id,
      name: newCentre.name,
      district: newCentre.district
    }
  };
}

/**
 * Cancel Booking (DELETE /api/bookings/:id)
 * Attempts PostgreSQL RPC transaction (cancel_booking_transaction) first.
 * Falls back to atomic conditional update with compensating rollback if RPC is not yet compiled.
 */
export async function cancelBooking(authUserId, bookingId) {
  // 1. Try PostgreSQL RPC transaction
  const { data: rpcData, error: rpcError } = await supabase.rpc('cancel_booking_transaction', {
    p_auth_user_id: authUserId,
    p_booking_id: bookingId
  });

  if (!rpcError) {
    return rpcData;
  }

  if (rpcError.code !== 'PGRST202') {
    const message = mapRpcErrorToClientMessage(rpcError.message);
    throw new Error(message);
  }

  // 2. Application-level atomic fallback
  const { farmer } = await getAuthenticatedFarmer(authUserId);

  if (!farmer) {
    throw new Error('Farmer profile not found for authenticated user.');
  }

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('farmer_id', farmer.id)
    .maybeSingle();

  if (bErr || !booking) {
    throw new Error('Booking not found.');
  }

  if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
    throw new Error('Booking cannot be cancelled in its current status.');
  }

  const qty = Number(booking.quantity_quintals);

  const { data: cancelledBooking, error: cancelErr } = await supabase
    .from('bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', booking.id)
    .select()
    .single();

  if (cancelErr || !cancelledBooking) {
    throw new Error('Failed to cancel booking.');
  }

  const { data: slot } = await supabase
    .from('slots')
    .select('*')
    .eq('id', booking.slot_id)
    .maybeSingle();

  if (slot) {
    const releasedCap = Math.max(0, Number(slot.booked_capacity_quintals) - qty);
    const releasedFarmers = Math.max(0, Number(slot.booked_farmers) - 1);
    await supabase
      .from('slots')
      .update({
        booked_capacity_quintals: releasedCap,
        booked_farmers: releasedFarmers
      })
      .eq('id', slot.id);
  }

  await supabase
    .from('procurement_requests')
    .update({ status: 'SUBMITTED' })
    .eq('id', booking.procurement_request_id);

  return {
    id: cancelledBooking.id,
    booking_reference: cancelledBooking.booking_reference,
    procurement_request_id: cancelledBooking.procurement_request_id,
    slot_id: cancelledBooking.slot_id,
    status: cancelledBooking.status,
    updated_at: cancelledBooking.updated_at
  };
}
