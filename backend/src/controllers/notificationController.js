import notificationService from '../services/notification.service.js';
import { supabase } from '../config/supabase.js';

/**
 * Handles manual triggering of notification events (for operational events/testing).
 */
export async function handleTriggerNotification(req, res) {
  try {
    const { eventType, context } = req.body || {};
    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'eventType is required.'
      });
    }

    const mergedContext = {
      userId: req.user?.id,
      ...(context || {})
    };

    const result = await notificationService.triggerNotification(eventType, mergedContext);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to trigger notification.'
    });
  }
}

/**
 * Retrieves notifications for logged-in user from the database.
 */
export async function handleGetUserNotifications(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User ID required.'
      });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, is_read, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: notifications || []
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve notifications.'
    });
  }
}

export default {
  handleTriggerNotification,
  handleGetUserNotifications
};
