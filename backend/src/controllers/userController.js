// =============================================
// ParkEase - User Controller
// =============================================
const UserService = require('../services/userService');

const UserController = {
  /**
   * POST /api/v1/users/register
   * Register a new user (link Firebase account to local DB)
   */
  async register(req, res, next) {
    try {
      // Check if user is truly new
      if (!req.user.isNewUser) {
        return res.status(200).json({
          status: 'success',
          message: 'User already registered.',
          data: req.user,
        });
      }

      const phone = req.body.phone || req.user.phone;
      if (!phone) {
        return res.status(400).json({ status: 'error', message: 'Phone number is required.' });
      }

      const user = await UserService.createUser({
        firebaseUid: req.user.firebaseUid,
        name: req.body.name,
        phone,
        email: req.body.email || req.user.email || null,
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully.',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      if (req.user.isNewUser) {
        return res.status(200).json({
          status: 'success',
          message: 'User is authenticated but not registered yet.',
          data: {
            firebaseUid: req.user.firebaseUid,
            email: req.user.email,
            isNewUser: true,
          },
        });
      }

      const user = await UserService.getUserById(req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Profile retrieved successfully.',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/users/me
   * Update current user profile
   */
  async updateProfile(req, res, next) {
    try {
      const updated = await UserService.updateUser(req.user.id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/users/me
   * Delete current user account (transactional)
   */
  async deleteAccount(req, res, next) {
    try {
      await UserService.deleteUser(req.user.id, req.user.firebaseUid);

      res.status(200).json({
        status: 'success',
        message: 'Account deleted successfully. All associated data has been removed.',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
