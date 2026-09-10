import { createBookingSchema, rescheduleBookingSchema } from '../validators/bookingValidator.js';
import { createBooking, rescheduleBooking, cancelBooking } from '../services/bookingService.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function handleCreateBooking(req, res) {
  try {
    const parseResult = createBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const booking = await createBooking(req.user.id, parseResult.data);
    return res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    const message = err.message || 'Failed to create booking.';
    if (message.includes('Procurement request not found.')) {
      return res.status(404).json({
        success: false,
        message
      });
    }
    if (
      message.includes('already has an active booking') ||
      message.includes('not eligible for booking') ||
      message.includes('Slot not found') ||
      message.includes('closed or unavailable') ||
      message.includes('sufficient capacity')
    ) {
      return res.status(400).json({
        success: false,
        message
      });
    }
    return res.status(400).json({
      success: false,
      message
    });
  }
}

export async function handleRescheduleBooking(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.'
      });
    }

    const parseResult = rescheduleBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const updatedBooking = await rescheduleBooking(req.user.id, id, parseResult.data);
    return res.status(200).json({
      success: true,
      data: updatedBooking
    });
  } catch (err) {
    const message = err.message || 'Failed to reschedule booking.';
    if (message.includes('Booking not found.')) {
      return res.status(404).json({
        success: false,
        message
      });
    }
    return res.status(400).json({
      success: false,
      message
    });
  }
}

export async function handleCancelBooking(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.'
      });
    }

    const result = await cancelBooking(req.user.id, id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    const message = err.message || 'Failed to cancel booking.';
    if (message.includes('Booking not found.')) {
      return res.status(404).json({
        success: false,
        message
      });
    }
    return res.status(400).json({
      success: false,
      message
    });
  }
}
