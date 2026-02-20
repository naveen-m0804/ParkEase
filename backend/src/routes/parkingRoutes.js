// =============================================
// VoidPark - Parking Routes
// =============================================

const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { authenticate, requireLocalUser } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const {
  createParkingSchema,
  updateParkingSchema,
  nearbyQuerySchema,
  searchQuerySchema,
} = require('../models/schemas');

// All parking routes require auth + registration
router.use(authenticate, requireLocalUser);

// ── Search & Discovery ──
router.get('/nearby',   validateQuery(nearbyQuerySchema),  parkingController.getNearby);
router.get('/search',   validateQuery(searchQuerySchema),  parkingController.search);

// ── Owner's own spaces ──
router.get('/my',                                          parkingController.getMySpaces);

// ── CRUD ──
router.post('/',        validate(createParkingSchema),     parkingController.create);
router.get('/:id',                                         parkingController.getById);
router.put('/:id',      validate(updateParkingSchema),     parkingController.update);
router.delete('/:id',                                      parkingController.remove);

module.exports = router;
