// =============================================
// VoidPark - Parking Controller
// =============================================

const parkingService = require('../services/parkingService');

// ── 1. Create Parking Space ──
async function create(req, res, next) {
  try {
    const space = await parkingService.createParkingSpace(req.user.id, req.body);

    if (req.app.get('io')) {
      req.app.get('io').to('dashboard').emit('parkingUpdated', {
        type: 'created',
        parkingId: space.id,
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Parking space created successfully.',
      data: space,
    });
  } catch (err) {
    next(err);
  }
}

// ── 2. Get Nearby Parking (all, sorted by distance ASC) ──
async function getNearby(req, res, next) {
  try {
    const spaces = await parkingService.getNearbyParking(req.query.lat, req.query.lng, req.user?.id);

    res.json({
      status: 'success',
      message: `Found ${spaces.length} parking space(s).`,
      data: spaces,
    });
  } catch (err) {
    next(err);
  }
}

// ── 3. Search Parking by Name/Address ──
async function search(req, res, next) {
  try {
    const spaces = await parkingService.searchParking(req.query.query, req.user?.id);

    res.json({
      status: 'success',
      message: `Found ${spaces.length} result(s).`,
      data: spaces,
    });
  } catch (err) {
    next(err);
  }
}

// ── 4. Get My Parking Spaces (owner view) ──
async function getMySpaces(req, res, next) {
  try {
    const spaces = await parkingService.getMyParkingSpaces(req.user.id);

    res.json({
      status: 'success',
      message: `You have ${spaces.length} parking space(s).`,
      data: spaces,
    });
  } catch (err) {
    next(err);
  }
}

// ── 5. Get Parking Space by ID ──
async function getById(req, res, next) {
  try {
    const space = await parkingService.getParkingById(req.params.id, req.query.startTime, req.query.endTime);

    res.json({
      status: 'success',
      message: 'Parking space details retrieved.',
      data: space,
    });
  } catch (err) {
    next(err);
  }
}

// ── 6. Update Parking Space ──
async function update(req, res, next) {
  try {
    const space = await parkingService.updateParkingSpace(req.params.id, req.user.id, req.body);

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`parking:${req.params.id}`).emit('parkingUpdated', {
        type: 'updated',
        parkingId: req.params.id,
      });
      io.to('dashboard').emit('parkingUpdated', {
        type: 'updated',
        parkingId: req.params.id,
      });
    }

    res.json({
      status: 'success',
      message: 'Parking space updated successfully.',
      data: space,
    });
  } catch (err) {
    next(err);
  }
}

// ── 7. Delete Parking Space ──
async function remove(req, res, next) {
  try {
    await parkingService.deleteParkingSpace(req.params.id, req.user.id);

    if (req.app.get('io')) {
      req.app.get('io').to('dashboard').emit('parkingUpdated', {
        type: 'deleted',
        parkingId: req.params.id,
      });
    }

    res.json({
      status: 'success',
      message: 'Parking space deleted successfully.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getNearby, search, getMySpaces, getById, update, remove };
