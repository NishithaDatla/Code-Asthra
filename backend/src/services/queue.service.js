import supabase from '../config/supabase.js';
import { validateTransition } from '../utils/queueStateMachine.js';

/**
 * SmartProcure Queue Service (Phase 2A)
 *
 * Provides business-level functions for queue operations, invoking atomic
 * PostgreSQL RPC functions for state mutations and executing scoped dynamic
 * calculations for queue positioning.
 */

/**
 * Checks in a confirmed booking into the queue.
 * Performs atomic booking status change (CONFIRMED -> CHECKED_IN), queue entry creation (WAITING),
 * and TOKEN_ISSUED audit event creation inside PostgreSQL.
 *
 * @param {Object} params
 * @param {string} params.bookingId - UUID of the booking
 * @param {string} [params.tokenNumber] - Optional manual token number (auto-generated if omitted)
 * @param {Object} [params.metadata] - Optional metadata object for audit log
 * @returns {Promise<Object>} Created queue entry
 */
export async function checkInBooking({ bookingId, tokenNumber = null, metadata = {} }) {
  if (!bookingId) {
    const error = new Error('Booking ID is required for check-in');
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase.rpc('fn_check_in_booking', {
    p_booking_id: bookingId,
    p_token_number: tokenNumber,
    p_metadata: metadata
  });

  if (error) {
    const err = new Error(`Queue Check-in Failed: ${error.message}`);
    err.statusCode = error.code === 'P0001' ? 400 : 500;
    err.details = error;
    throw err;
  }

  return data;
}

/**
 * Updates a queue entry status through a validated transition.
 * Executes fast application pre-check, followed by atomic PostgreSQL RPC mutation.
 *
 * @param {Object} params
 * @param {string} params.queueEntryId - UUID of the queue entry
 * @param {string} params.targetStatus - Target queue_status_enum value
 * @param {string} [params.counterId] - Mandatory UUID of centre counter when targetStatus is CALLED
 * @param {Object} [params.metadata] - Optional metadata object for audit log
 * @returns {Promise<Object>} Updated queue entry
 */
export async function updateQueueStatus({ queueEntryId, targetStatus, counterId = null, metadata = {} }) {
  if (!queueEntryId) {
    const error = new Error('Queue Entry ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (!targetStatus) {
    const error = new Error('Target queue status is required');
    error.statusCode = 400;
    throw error;
  }

  // 1. Retrieve current entry for application pre-validation
  const { data: currentEntry, error: fetchError } = await supabase
    .from('queue_entries')
    .select('id, status, centre_id, counter_id, booking_id')
    .eq('id', queueEntryId)
    .single();

  if (fetchError || !currentEntry) {
    const error = new Error(`Queue entry with ID ${queueEntryId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 2. Application-side transition pre-validation
  validateTransition(currentEntry.status, targetStatus);

  // 3. Counter pre-check for WAITING -> CALLED
  if (targetStatus === 'CALLED' && !counterId) {
    const error = new Error('Counter ID is required when calling a token');
    error.statusCode = 400;
    throw error;
  }

  // 4. Atomic PostgreSQL RPC execution
  const { data, error } = await supabase.rpc('fn_update_queue_status', {
    p_queue_entry_id: queueEntryId,
    p_target_status: targetStatus,
    p_counter_id: counterId,
    p_metadata: metadata
  });

  if (error) {
    const err = new Error(`Queue Status Transition Failed: ${error.message}`);
    err.statusCode = error.code === 'P0001' ? 400 : 500;
    err.details = error;
    throw err;
  }

  return data;
}

/**
 * Fetches a single queue entry by ID along with referenced entity metadata.
 *
 * @param {string} queueEntryId
 * @returns {Promise<Object>}
 */
export async function getQueueEntry(queueEntryId) {
  if (!queueEntryId) {
    const error = new Error('Queue Entry ID is required');
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase
    .from('queue_entries')
    .select(`
      *,
      booking:bookings(*),
      centre:procurement_centres(*),
      counter:centre_counters(*)
    `)
    .eq('id', queueEntryId)
    .single();

  if (error || !data) {
    const err = new Error(`Queue entry ${queueEntryId} not found`);
    err.statusCode = 404;
    throw err;
  }

  return data;
}

/**
 * Calculates the dynamic queue position for a WAITING entry.
 * Position is derived dynamically based on FIFO ordering (created_at) within the procurement centre.
 * Entries in CALLED, IN_SERVICE, COMPLETED, or SKIPPED status do NOT count as waiting entries ahead.
 *
 * @param {string} queueEntryId
 * @returns {Promise<Object>} Position calculation result
 */
export async function getQueuePosition(queueEntryId) {
  if (!queueEntryId) {
    const error = new Error('Queue Entry ID is required');
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch current entry
  const { data: entry, error: fetchError } = await supabase
    .from('queue_entries')
    .select('id, token_number, centre_id, status, created_at')
    .eq('id', queueEntryId)
    .single();

  if (fetchError || !entry) {
    const error = new Error(`Queue entry ${queueEntryId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 2. Return null position if not WAITING
  if (entry.status !== 'WAITING') {
    return {
      queueEntryId: entry.id,
      tokenNumber: entry.token_number,
      status: entry.status,
      position: null,
      message: `Queue entry status is '${entry.status}'. Position is only available for WAITING entries.`
    };
  }

  // 3. Count WAITING entries created earlier in the same procurement centre
  const { count, error: countError } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .eq('centre_id', entry.centre_id)
    .eq('status', 'WAITING')
    .lt('created_at', entry.created_at);

  if (countError) {
    const err = new Error(`Failed to calculate queue position: ${countError.message}`);
    err.statusCode = 500;
    throw err;
  }

  const position = (count || 0) + 1;

  return {
    queueEntryId: entry.id,
    tokenNumber: entry.token_number,
    centreId: entry.centre_id,
    status: entry.status,
    position,
    createdAt: entry.created_at
  };
}

/**
 * Fetches the audit event history for a specific queue entry.
 *
 * @param {string} queueEntryId
 * @returns {Promise<Array>} List of queue events
 */
export async function getQueueEvents(queueEntryId) {
  if (!queueEntryId) {
    const error = new Error('Queue Entry ID is required');
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase
    .from('queue_events')
    .select('*')
    .eq('queue_entry_id', queueEntryId)
    .order('event_timestamp', { ascending: true });

  if (error) {
    const err = new Error(`Failed to fetch queue events: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export default {
  checkInBooking,
  updateQueueStatus,
  getQueueEntry,
  getQueuePosition,
  getQueueEvents
};
