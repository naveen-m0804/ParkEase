// =============================================
// ParkEase - User Routes
// =============================================
const { Router } = require('express');
const UserController = require('../controllers/userController');
const { authenticate, requireLocalUser } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerUserSchema, updateUserSchema } = require('../models/schemas');

const router = Router();

// Register a new user (Firebase authenticated, but not yet in local DB)
router.post('/register', authenticate, validate(registerUserSchema), UserController.register);

// Get current user profile
router.get('/me', authenticate, UserController.getProfile);

// Update current user profile
router.put('/me', authenticate, requireLocalUser, validate(updateUserSchema), UserController.updateProfile);

// Delete current user account
router.delete('/me', authenticate, requireLocalUser, UserController.deleteAccount);

module.exports = router;
