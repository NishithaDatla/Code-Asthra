import queueService from '../services/queue.service.js';
import queueEventService from '../services/queueEvent.service.js';
import etaService from '../services/eta.service.js';
import notificationService, { NOTIFICATION_EVENT_TYPES } from '../services/notification.service.js';
import supabase from '../config/supabase.js';
import {
  getStaffCentreId,
  verifyCheckInAuthorization,
  verifyStatusTransitionAuthorization,
  verifyQueueAccessAuthorization
} from '../utils/queueAuth.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * PRD Endpoint 1: POST /api/queue/:bookingId/check-in
 * Booking check-in using URL parameter bookingId (does not trust client body booking_id).
 */
export async function handleCheckInPRD(req, res) {
  try {
    const bookingId = req.params.bookingId || req.body?.bookingId || req.body?.booking_id;
    if (!bookingId || !UUID_REGEX.test(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId format. UUID required.'
      });
    }

    const centreId = req.body?.centreId || req.body?.centre_id;
    if (centreId && !UUID_REGEX.test(centreId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid centreId format. UUID required.'
      });
    }

    // Role & Centre RBAC verification
    await verifyCheckInAuthorization(req.user, bookingId);

    const queueEntry = await queueService.checkInBooking({
      bookingId,
      centreId,
      tokenNumber: req.body?.tokenNumber || req.body?.token_number
    });

    // Trigger notification asynchronously
    notificationService.triggerNotification(NOTIFICATION_EVENT_TYPES.CHECK_IN_CONFIRMED, {
      userId: req.user?.id,
      queueEntryId: queueEntry.id,
      tokenNumber: queueEntry.token_number,
      position: queueEntry.queue_position
    }).catch(err => console.warn('[CheckIn Notification Error]:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Booking checked in successfully.',
      data: queueEntry
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Check-in failed.'
    });
  }
}

/**
 * Legacy Check-In Endpoint: POST /api/queue/check-in
 */
export async function handleCheckIn(req, res) {
  return handleCheckInPRD(req, res);
}

/**
 * PRD Endpoint 2: GET /api/queue/:bookingId
 * Retrieves queue information, position, and ETA for a specific booking ID.
 */
export async function handleGetQueueByBookingId(req, res) {
  try {
    const { bookingId } = req.params;
    if (!bookingId || !UUID_REGEX.test(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId format. UUID required.'
      });
    }

    // Query queue entry associated with this booking
    const { data: queueEntry, error: fetchErr } = await supabase
      .from('queue_entries')
      .select(`
        *,
        booking:bookings(*),
        centre:procurement_centres(*),
        counter:centre_counters(*)
      `)
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (fetchErr || !queueEntry) {
      return res.status(404).json({
        success: false,
        message: `Queue entry not found for booking ${bookingId}`
      });
    }

    // Role & Ownership RBAC verification for queue access
    await verifyQueueAccessAuthorization(req.user, queueEntry.id);

    // Compute dynamic position and ETA
    const positionData = await queueService.getQueuePosition(queueEntry.id);
    const etaData = await etaService.getTokenETA(queueEntry.id);

    return res.status(200).json({
      success: true,
      data: {
        ...queueEntry,
        position: positionData.position,
        estimated_wait_time_minutes: etaData.estimatedWaitTimeMinutes,
        estimated_start_time: etaData.estimatedStartTime,
        eta: etaData,
        queue_position: positionData
      }
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve queue entry.'
    });
  }
}

/**
 * PRD Endpoint 3: POST /api/queue/call-next
 * Calls the next WAITING farmer in queue for the staff's assigned centre.
 */
export async function handleCallNext(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authorization required.'
      });
    }

    if (req.user.role === 'FARMER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Farmers cannot call queue entries.'
      });
    }

    let centreId = req.body?.centreId || req.query?.centreId;

    if (req.user.role === 'CENTRE_STAFF' || req.user.role === 'CENTRE_ADMIN') {
      const staffCentreId = await getStaffCentreId(req.user.db_id);
      if (!staffCentreId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Staff is not assigned to an active procurement centre.'
        });
      }
      centreId = staffCentreId;
    } else if (req.user.role === 'SYSTEM_ADMIN' && !centreId) {
      // If system admin didn't specify centreId, try finding staff centre or first open centre
      const staffCentreId = await getStaffCentreId(req.user.db_id);
      if (staffCentreId) {
        centreId = staffCentreId;
      } else {
        const { data: firstCentre } = await supabase
          .from('procurement_centres')
          .select('id')
          .eq('status', 'OPEN')
          .limit(1)
          .maybeSingle();
        centreId = firstCentre?.id;
      }
    }

    if (!centreId) {
      return res.status(400).json({
        success: false,
        message: 'Centre ID is required to call next token.'
      });
    }

    // Find next WAITING queue entry in this centre (FIFO by created_at)
    const { data: nextEntry, error: findErr } = await supabase
      .from('queue_entries')
      .select('id, token_number, centre_id, booking_id, status')
      .eq('centre_id', centreId)
      .eq('status', 'WAITING')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findErr || !nextEntry) {
      return res.status(404).json({
        success: false,
        message: 'No waiting farmers in queue for this centre.'
      });
    }

    // Counter ID resolution
    let counterId = req.body?.counterId || req.body?.counter_id;
    if (!counterId) {
      const { data: firstCounter } = await supabase
        .from('centre_counters')
        .select('id')
        .eq('centre_id', centreId)
        .eq('is_active', true)
        .order('counter_number', { ascending: true })
        .limit(1)
        .maybeSingle();
      counterId = firstCounter?.id;
    }

    if (!counterId) {
      return res.status(400).json({
        success: false,
        message: 'Counter ID is required when calling a token.'
      });
    }

    // Execute status transition WAITING -> CALLED
    const updatedEntry = await queueService.updateQueueStatus({
      queueEntryId: nextEntry.id,
      targetStatus: 'CALLED',
      counterId
    });

    // Notification trigger
    notificationService.triggerNotification(NOTIFICATION_EVENT_TYPES.QUEUE_CALLED, {
      userId: req.user?.id,
      queueEntryId: updatedEntry.id,
      tokenNumber: updatedEntry.token_number,
      counterNumber: `Counter ${counterId}`
    }).catch(err => console.warn('[QueueStatus Notification Error]:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Next waiting token called successfully.',
      data: updatedEntry
    });
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to call next token.'
    });
  }
}

/**
 * PRD Endpoint 4: POST /api/queue/:id/start
 * Transitions queue entry status to IN_SERVICE.
 */
export async function handleStartService(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue entry ID format.'
      });
    }

    if (req.user?.role === 'FARMER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Farmers cannot perform queue status transitions.'
      });
    }

    // Role & Centre RBAC verification
    await verifyStatusTransitionAuthorization(req.user, id);

    const updatedEntry = await queueService.updateQueueStatus({
      queueEntryId: id,
      targetStatus: 'IN_SERVICE',
      counterId: req.body?.counterId || req.body?.counter_id
    });

    notificationService.triggerNotification(NOTIFICATION_EVENT_TYPES.SERVICE_STARTED, {
      userId: req.user?.id,
      queueEntryId: updatedEntry.id,
      tokenNumber: updatedEntry.token_number
    }).catch(err => console.warn('[QueueStatus Notification Error]:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Queue status updated to IN_SERVICE.',
      data: updatedEntry
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to start service.'
    });
  }
}

/**
 * PRD Endpoint 5: POST /api/queue/:id/complete
 * Transitions queue entry status to COMPLETED.
 */
export async function handleCompleteService(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue entry ID format.'
      });
    }

    if (req.user?.role === 'FARMER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Farmers cannot perform queue status transitions.'
      });
    }

    // Role & Centre RBAC verification
    await verifyStatusTransitionAuthorization(req.user, id);

    const updatedEntry = await queueService.updateQueueStatus({
      queueEntryId: id,
      targetStatus: 'COMPLETED',
      cancellationReason: req.body?.notes || req.body?.cancellationReason
    });

    notificationService.triggerNotification(NOTIFICATION_EVENT_TYPES.SERVICE_COMPLETED, {
      userId: req.user?.id,
      queueEntryId: updatedEntry.id,
      tokenNumber: updatedEntry.token_number
    }).catch(err => console.warn('[QueueStatus Notification Error]:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Queue status updated to COMPLETED.',
      data: updatedEntry
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to complete service.'
    });
  }
}

/**
 * Legacy Queue Status Update Endpoint: PATCH /api/queue/:id/status
 */
export async function handleUpdateQueueStatus(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue entry ID format.'
      });
    }

    const { status, counterId, cancellationReason } = req.body || {};
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Target status is required.'
      });
    }

    // Role & Centre RBAC verification for status transitions
    await verifyStatusTransitionAuthorization(req.user, id);

    const updatedEntry = await queueService.updateQueueStatus({
      queueEntryId: id,
      targetStatus: status,
      counterId,
      cancellationReason
    });

    // Trigger state change notification
    let eventType = null;
    if (status === 'CALLED') eventType = NOTIFICATION_EVENT_TYPES.QUEUE_CALLED;
    else if (status === 'IN_SERVICE') eventType = NOTIFICATION_EVENT_TYPES.SERVICE_STARTED;
    else if (status === 'COMPLETED') eventType = NOTIFICATION_EVENT_TYPES.SERVICE_COMPLETED;

    if (eventType) {
      notificationService.triggerNotification(eventType, {
        userId: req.user?.id,
        queueEntryId: updatedEntry.id,
        tokenNumber: updatedEntry.token_number,
        counterNumber: counterId ? `Counter ${counterId}` : 'Counter'
      }).catch(err => console.warn('[QueueStatus Notification Error]:', err.message));
    }

    return res.status(200).json({
      success: true,
      message: `Queue status updated to ${status}.`,
      data: updatedEntry
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to update queue status.'
    });
  }
}

/**
 * Retrieves dynamic queue position for a queue entry.
 */
export async function handleGetQueuePosition(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue entry ID format.'
      });
    }

    // Role & Ownership RBAC verification for queue access
    await verifyQueueAccessAuthorization(req.user, id);

    const positionData = await queueService.getQueuePosition(id);
    return res.status(200).json({
      success: true,
      data: positionData
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve queue position.'
    });
  }
}

/**
 * Retrieves Estimated Time of Arrival (ETA) for a queue entry.
 */
export async function handleGetTokenETA(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue entry ID format.'
      });
    }

    // Role & Ownership RBAC verification for queue access
    await verifyQueueAccessAuthorization(req.user, id);

    const etaData = await etaService.getTokenETA(id);
    return res.status(200).json({
      success: true,
      data: etaData
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to calculate ETA.'
    });
  }
}

/**
 * Retrieves event audit log for a queue entry.
 */
export async function handleGetQueueEvents(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue entry ID format.'
      });
    }

    // Role & Ownership RBAC verification for queue access
    await verifyQueueAccessAuthorization(req.user, id);

    const events = await queueService.getQueueEvents(id);
    return res.status(200).json({
      success: true,
      data: events
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve queue events.'
    });
  }
}

export default {
  handleCheckInPRD,
  handleCheckIn,
  handleGetQueueByBookingId,
  handleCallNext,
  handleStartService,
  handleCompleteService,
  handleUpdateQueueStatus,
  handleGetQueuePosition,
  handleGetTokenETA,
  handleGetQueueEvents
};

