import queueService from '../services/queue.service.js';
import queueEventService from '../services/queueEvent.service.js';
import etaService from '../services/eta.service.js';
import notificationService, { NOTIFICATION_EVENT_TYPES } from '../services/notification.service.js';
import {
  verifyCheckInAuthorization,
  verifyStatusTransitionAuthorization,
  verifyQueueAccessAuthorization
} from '../utils/queueAuth.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Handles atomic booking check-in and queue entry creation.
 */
export async function handleCheckIn(req, res) {
  try {
    const { bookingId, centreId } = req.body || {};
    if (!bookingId || !UUID_REGEX.test(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId format. UUID required.'
      });
    }

    if (centreId && !UUID_REGEX.test(centreId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid centreId format. UUID required.'
      });
    }

    // Role & Centre RBAC verification
    await verifyCheckInAuthorization(req.user, bookingId);

    const queueEntry = await queueService.checkInBooking({ bookingId, centreId });

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
 * Handles atomic queue status transitions (WAITING -> CALLED -> IN_SERVICE -> COMPLETED/SKIPPED).
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
  handleCheckIn,
  handleUpdateQueueStatus,
  handleGetQueuePosition,
  handleGetTokenETA,
  handleGetQueueEvents
};
