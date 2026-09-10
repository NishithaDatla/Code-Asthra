import supabase from '../config/supabase.js';

/**
 * Resolves centre_id for a CENTRE_STAFF or CENTRE_ADMIN user.
 *
 * @param {string} userId - Users UUID (db_id)
 * @returns {Promise<string|null>} Assigned centre UUID or null
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
 * Verifies authorization for checking in a booking.
 * - FARMER: booking.farmer_id MUST match user's farmer_id.
 * - CENTRE_STAFF / CENTRE_ADMIN: booking.slot.centre_id MUST match staff's assigned centre_id.
 * - SYSTEM_ADMIN: Allowed.
 *
 * @param {Object} user - req.user object attached by authMiddleware
 * @param {string} bookingId - Booking UUID
 */
export async function verifyCheckInAuthorization(user, bookingId) {
  if (!user) {
    const err = new Error('Unauthorized. Authorization required.');
    err.statusCode = 401;
    throw err;
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, farmer_id, slot:slots(centre_id)')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) {
    const err = new Error(`Booking ID ${bookingId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'SYSTEM_ADMIN') {
    return true;
  }

  if (user.role === 'FARMER') {
    if (!user.farmer_id || booking.farmer_id !== user.farmer_id) {
      const err = new Error('Forbidden. You can only check in your own bookings.');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }

  if (user.role === 'CENTRE_STAFF' || user.role === 'CENTRE_ADMIN') {
    const staffCentreId = await getStaffCentreId(user.db_id);
    const bookingCentreId = booking.slot?.centre_id;
    if (!staffCentreId || staffCentreId !== bookingCentreId) {
      const err = new Error('Forbidden. Staff can only check in bookings for their assigned centre.');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }

  const err = new Error('Forbidden. You do not have permission to check in bookings.');
  err.statusCode = 403;
  throw err;
}

/**
 * Verifies authorization for queue status transitions (PATCH /api/queue/:id/status).
 * - FARMER: Forbidden (403).
 * - CENTRE_STAFF / CENTRE_ADMIN: Must match queue entry's centre_id.
 * - SYSTEM_ADMIN: Allowed.
 *
 * @param {Object} user - req.user object attached by authMiddleware
 * @param {string} queueEntryId - Queue Entry UUID
 */
export async function verifyStatusTransitionAuthorization(user, queueEntryId) {
  if (!user) {
    const err = new Error('Unauthorized. Authorization required.');
    err.statusCode = 401;
    throw err;
  }

  if (user.role === 'FARMER') {
    const err = new Error('Forbidden. Farmers cannot perform queue status transitions.');
    err.statusCode = 403;
    throw err;
  }

  const { data: entry } = await supabase
    .from('queue_entries')
    .select('id, centre_id')
    .eq('id', queueEntryId)
    .maybeSingle();

  if (!entry) {
    const err = new Error(`Queue entry ${queueEntryId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'SYSTEM_ADMIN') {
    return true;
  }

  if (user.role === 'CENTRE_STAFF' || user.role === 'CENTRE_ADMIN') {
    const staffCentreId = await getStaffCentreId(user.db_id);
    if (!staffCentreId || staffCentreId !== entry.centre_id) {
      const err = new Error('Forbidden. Staff can only operate queues for their assigned centre.');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }

  const err = new Error('Forbidden. Unauthorized user role.');
  err.statusCode = 403;
  throw err;
}

/**
 * Verifies authorization for reading queue entry details (position, ETA, events).
 * - FARMER: Must own the booking associated with the queue entry.
 * - CENTRE_STAFF / CENTRE_ADMIN: Must belong to the queue entry's centre_id.
 * - SYSTEM_ADMIN: Allowed.
 *
 * @param {Object} user - req.user object attached by authMiddleware
 * @param {string} queueEntryId - Queue Entry UUID
 */
export async function verifyQueueAccessAuthorization(user, queueEntryId) {
  if (!user) {
    const err = new Error('Unauthorized. Authorization required.');
    err.statusCode = 401;
    throw err;
  }

  if (user.role === 'SYSTEM_ADMIN') {
    return true;
  }

  const { data: entry } = await supabase
    .from('queue_entries')
    .select('id, centre_id, booking:bookings(farmer_id)')
    .eq('id', queueEntryId)
    .maybeSingle();

  if (!entry) {
    const err = new Error(`Queue entry ${queueEntryId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'FARMER') {
    if (!user.farmer_id || entry.booking?.farmer_id !== user.farmer_id) {
      const err = new Error('Forbidden. You can only view queue details for your own booking.');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }

  if (user.role === 'CENTRE_STAFF' || user.role === 'CENTRE_ADMIN') {
    const staffCentreId = await getStaffCentreId(user.db_id);
    if (!staffCentreId || staffCentreId !== entry.centre_id) {
      const err = new Error('Forbidden. Staff can only view queue details for their assigned centre.');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }

  const err = new Error('Forbidden. Unauthorized user role.');
  err.statusCode = 403;
  throw err;
}

export default {
  getStaffCentreId,
  verifyCheckInAuthorization,
  verifyStatusTransitionAuthorization,
  verifyQueueAccessAuthorization
};
