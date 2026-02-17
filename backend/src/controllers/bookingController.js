// =============================================
// ParkEase - Booking Controller
// =============================================
const bookingService = require('../services/bookingService');

// ── 1. Create Booking (confirmed immediately, no payment gateway) ──
async function create(req, res, next) {
  try {
    const result = await bookingService.createBooking(req.user.id, req.body);

    // Emit Socket.IO event for real-time updates
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`parking:${req.body.parkingId}`).emit('slotBooked', {
        parkingId: req.body.parkingId,
        slotId: result.slot.id,
        slotNumber: result.slot.slotNumber,
        vehicleType: req.body.vehicleType,
        startTime: req.body.startTime,
        endTime: req.body.endTime || null,
      });
      io.to('dashboard').emit('slotBooked', {
        parkingId: req.body.parkingId,
      });
    }

    res.status(201).json({
      status: 'success',
      message: result.pricing.isOpenEnded
        ? `Booking confirmed! Open-ended at ₹${result.pricing.hourlyRate}/hr. End the booking when you leave.`
        : `Booking confirmed! Total amount: ₹${result.pricing.totalAmount}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ── 2. End Booking (set end time, calculate final amount) ──
async function endBooking(req, res, next) {
  try {
    const booking = await bookingService.endBooking(
      req.params.id,
      req.user.id,
      req.body.endTime
    );

    // Emit Socket.IO event
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`parking:${booking.parking_id}`).emit('slotReleased', {
        parkingId: booking.parking_id,
        slotId: booking.slot_id,
      });
      io.to('dashboard').emit('slotReleased', {
        parkingId: booking.parking_id,
      });
    }

    res.json({
      status: 'success',
      message: `Booking completed. Total amount: ₹${booking.total_amount}.`,
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

// ── 3. Cancel Booking (by user) ──
async function cancel(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id);

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`parking:${booking.parking_id}`).emit('slotReleased', {
        parkingId: booking.parking_id,
        slotId: booking.slot_id,
      });
      io.to('dashboard').emit('slotReleased', {
        parkingId: booking.parking_id,
      });
    }

    res.json({
      status: 'success',
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

// ── 4. Cancel Booking (by owner) ──
async function ownerCancel(req, res, next) {
  try {
    const booking = await bookingService.ownerCancelBooking(req.params.id, req.user.id);

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`parking:${booking.parking_id}`).emit('slotReleased', {
        parkingId: booking.parking_id,
        slotId: booking.slot_id,
      });
      io.to('dashboard').emit('slotReleased', {
        parkingId: booking.parking_id,
      });
    }

    res.json({
      status: 'success',
      message: 'Booking cancelled by owner.',
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

// ── 5. Get My Bookings (user's own bookings) ──
async function getMyBookings(req, res, next) {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);

    res.json({
      status: 'success',
      message: `Found ${bookings.length} booking(s).`,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
}

// ── 6. Get Owner Bookings (bookings on my parking spaces) ──
async function getOwnerBookings(req, res, next) {
  try {
    const bookings = await bookingService.getOwnerBookings(req.user.id);

    res.json({
      status: 'success',
      message: `Found ${bookings.length} booking(s) on your parking spaces.`,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
}

// ── 7. Get Booking by ID ──
async function getById(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.id);

    res.json({
      status: 'success',
      message: 'Booking details retrieved.',
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  endBooking,
  cancel,
  ownerCancel,
  getMyBookings,
  getOwnerBookings,
  getById,
};
