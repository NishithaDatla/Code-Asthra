/**
 * SmartProcure Notification Triggering Service (Phase 2E.1)
 *
 * Generates SMS-compatible, plain-text notification payloads and stores notification records
 * in the database for key queue, scheduling, and disruption events.
 *
 * Core Principles:
 * - Read-Only on Queue/Booking State: Never mutates queue, booking, slot, or counter records.
 * - Idempotent: Prevents duplicate notifications for the same event reference.
 * - SMS-Compatible: Uses simple plain text readable on basic feature phones (non-smartphone friendly).
 * - Schema-Compliant: Respects notification_type_enum:
 *   ('BOOKING_CONFIRMED', 'SLOT_REMINDER', 'QUEUE_CALLED', 'PROCUREMENT_UPDATED', 'PAYMENT_PROCESSED', 'SYSTEM_ALERT')
 */

let supabaseClient = null;
async function getSupabase() {
  if (!supabaseClient) {
    try {
      const mod = await import('../config/supabase.js');
      supabaseClient = mod.default || mod.supabase;
    } catch (e) {
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

export const NOTIFICATION_EVENT_TYPES = {
  CHECK_IN_CONFIRMED: 'CHECK_IN_CONFIRMED',
  QUEUE_CALLED: 'QUEUE_CALLED',
  SERVICE_STARTED: 'SERVICE_STARTED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  ETA_UPDATED: 'ETA_UPDATED',
  DISRUPTION_ALERT: 'DISRUPTION_ALERT',
  SLOT_RECOMMENDED: 'SLOT_RECOMMENDED'
};

export const NOTIFICATION_TYPE_ENUMS = {
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  SLOT_REMINDER: 'SLOT_REMINDER',
  QUEUE_CALLED: 'QUEUE_CALLED',
  PROCUREMENT_UPDATED: 'PROCUREMENT_UPDATED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  SYSTEM_ALERT: 'SYSTEM_ALERT'
};

// In-memory set for event deduplication tracking in service layer
const dispatchedEventKeys = new Set();

/**
 * Generates an SMS-compatible notification payload for a specified operational event.
 *
 * @param {string} eventType - Event type from NOTIFICATION_EVENT_TYPES
 * @param {Object} context - Event context object
 * @returns {Object} Plain-text notification payload
 */
export function generateNotificationPayload(eventType, context = {}) {
  const userId = context.userId || context.farmerId || null;
  const tokenNumber = context.tokenNumber || context.token || 'N/A';
  const position = context.position || context.farmersAhead || 0;
  const counterNumber = context.counterNumber || context.counter || 'Counter';
  const waitMinutes = context.estimatedWaitTimeMinutes ?? context.waitMinutes ?? null;
  const centreName = context.centreName || context.centreCode || 'Procurement Centre';

  let dbNotificationType = NOTIFICATION_TYPE_ENUMS.PROCUREMENT_UPDATED;
  let title = 'SmartProcure Update';
  let message = `SmartProcure: Update for Token #${tokenNumber} at ${centreName}.`;

  switch (eventType) {
    case NOTIFICATION_EVENT_TYPES.CHECK_IN_CONFIRMED:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.BOOKING_CONFIRMED;
      title = 'Check-in Confirmed';
      message = `SmartProcure: Token #${tokenNumber} checked in at ${centreName}. Queue position: #${position}.`;
      break;

    case NOTIFICATION_EVENT_TYPES.QUEUE_CALLED:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.QUEUE_CALLED;
      title = 'Token Called';
      message = `SmartProcure: Token #${tokenNumber} CALLED to ${counterNumber} at ${centreName}. Please proceed immediately.`;
      break;

    case NOTIFICATION_EVENT_TYPES.SERVICE_STARTED:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.PROCUREMENT_UPDATED;
      title = 'Service Started';
      message = `SmartProcure: Service started for Token #${tokenNumber} at ${counterNumber}.`;
      break;

    case NOTIFICATION_EVENT_TYPES.SERVICE_COMPLETED:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.PROCUREMENT_UPDATED;
      title = 'Service Completed';
      message = `SmartProcure: Service completed for Token #${tokenNumber} at ${centreName}. Thank you.`;
      break;

    case NOTIFICATION_EVENT_TYPES.ETA_UPDATED:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.SLOT_REMINDER;
      title = 'ETA Update';
      message = waitMinutes !== null
        ? `SmartProcure: Token #${tokenNumber} ETA update: ~${waitMinutes} mins wait time (${position} farmer(s) ahead).`
        : `SmartProcure: Token #${tokenNumber} ETA update: Operations paused. Estimated wait time pending.`;
      break;

    case NOTIFICATION_EVENT_TYPES.DISRUPTION_ALERT:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.SYSTEM_ALERT;
      title = 'Operational Alert';
      message = `SmartProcure Alert: ${centreName} operational alert: ${context.disruptionMessage || 'Operations temporarily delayed.'}`;
      break;

    case NOTIFICATION_EVENT_TYPES.SLOT_RECOMMENDED:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.SLOT_REMINDER;
      title = 'Slot Recommendation';
      message = `SmartProcure: Recommended slot ${context.startTime || ''}-${context.endTime || ''} on ${context.slotDate || ''} at ${centreName}.`;
      break;

    default:
      dbNotificationType = NOTIFICATION_TYPE_ENUMS.PROCUREMENT_UPDATED;
      title = 'SmartProcure Notice';
      message = `SmartProcure: Notice for Token #${tokenNumber} at ${centreName}.`;
  }

  // Idempotency key construction based on reference ID or token & event type
  const referenceId = context.queueEntryId || context.bookingId || context.referenceId || `${userId}_${tokenNumber}`;
  const idempotencyKey = `${eventType}_${referenceId}`;

  return {
    userId,
    type: dbNotificationType,
    title,
    message,
    smsText: message,
    isSmsCompatible: true,
    idempotencyKey,
    createdAt: new Date().toISOString()
  };
}

/**
 * Triggers and stores a notification event in database with deduplication protection.
 *
 * @param {string} eventType - Event type
 * @param {Object} context - Event context
 * @returns {Promise<Object>} Created notification payload or deduplicated status
 */
export async function triggerNotification(eventType, context = {}) {
  const payload = generateNotificationPayload(eventType, context);

  // Deduplication check
  if (dispatchedEventKeys.has(payload.idempotencyKey)) {
    return {
      triggered: false,
      deduplicated: true,
      idempotencyKey: payload.idempotencyKey,
      message: 'Notification event already dispatched (duplicate prevented).'
    };
  }

  dispatchedEventKeys.add(payload.idempotencyKey);

  // Database persistence if userId is present and Supabase client exists
  if (payload.userId) {
    const supabase = await getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.warn(`[Notification Service Warning] Failed to insert notification DB record: ${error.message}`);
      } else if (data) {
        payload.id = data.id;
      }
    }
  }

  return {
    triggered: true,
    deduplicated: false,
    notification: payload
  };
}

/**
 * Resets the in-memory deduplication registry (for testing purposes).
 */
export function resetDeduplicationRegistry() {
  dispatchedEventKeys.clear();
}

export default {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_TYPE_ENUMS,
  generateNotificationPayload,
  triggerNotification,
  resetDeduplicationRegistry
};
