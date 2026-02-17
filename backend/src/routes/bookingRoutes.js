// =============================================
// ParkEase - Booking Routes
// =============================================
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, requireLocalUser } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createBookingSchema, endBookingSchema } = require('../models/schemas');

// All booking routes require authentication + registration
router.use(authenticate, requireLocalUser);

// ── User Booking Actions ──
router.post('/',            validate(createBookingSchema),       bookingController.create);
router.get('/my',                                                bookingController.getMyBookings);
router.get('/owner',                                             bookingController.getOwnerBookings);
router.get('/:id',                                               bookingController.getById);
router.post('/:id/cancel',                                       bookingController.cancel);
router.put('/:id/end',      validate(endBookingSchema),          bookingController.endBooking);

// ── Owner Booking Actions ──
router.post('/:id/owner-cancel',                                 bookingController.ownerCancel);

module.exports = router;
