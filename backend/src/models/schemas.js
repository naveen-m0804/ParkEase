// =============================================
// ParkEase - Zod Validation Schemas
// =============================================
const { z } = require('zod');

// ── USER SCHEMAS ──
const registerUserSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
});

// ── PARKING SPACE SCHEMAS ──
const createParkingSchema = z.object({
  placeName: z.string().min(1).max(255),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  pricePerHourCar: z.number().min(0).default(0),
  pricePerHourBike: z.number().min(0).default(0),
  pricePerHourOther: z.number().min(0).default(0),
  totalSlotsCar: z.number().int().min(0).default(0),
  totalSlotsBike: z.number().int().min(0).default(0),
  totalSlotsOther: z.number().int().min(0).default(0),
  description: z.string().max(2000).nullable().optional(),
});

const updateParkingSchema = z.object({
  placeName: z.string().min(1).max(255).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  pricePerHourCar: z.number().min(0).optional(),
  pricePerHourBike: z.number().min(0).optional(),
  pricePerHourOther: z.number().min(0).optional(),
  totalSlotsCar: z.number().int().min(0).optional(),
  totalSlotsBike: z.number().int().min(0).optional(),
  totalSlotsOther: z.number().int().min(0).optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

// ── SEARCH / NEARBY QUERY SCHEMAS ──
// Nearby: just lat and lng, returns all sorted by distance
const nearbyQuerySchema = z.object({
  lat: z.string().transform((v) => parseFloat(v)).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform((v) => parseFloat(v)).pipe(z.number().min(-180).max(180)),
});

const searchQuerySchema = z.object({
  query: z.string().min(1).max(255),
});

// ── BOOKING SCHEMAS ──
// endTime is OPTIONAL — user may not know when they'll return
const createBookingSchema = z.object({
  parkingId: z.string().uuid(),
  vehicleType: z.enum(['car', 'bike', 'other']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
});

// End a booking — provide the actual end time
const endBookingSchema = z.object({
  endTime: z.string().datetime(),
});

module.exports = {
  registerUserSchema,
  updateUserSchema,
  createParkingSchema,
  updateParkingSchema,
  nearbyQuerySchema,
  searchQuerySchema,
  createBookingSchema,
  endBookingSchema,
};
