// =============================================
// ParkEase - Route Index (aggregates all routes)
// =============================================
const { Router } = require('express');
const userRoutes = require('./userRoutes');
const parkingRoutes = require('./parkingRoutes');
const bookingRoutes = require('./bookingRoutes');

const router = Router();

// Mount sub-routes
router.use('/users', userRoutes);
router.use('/parking', parkingRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;
