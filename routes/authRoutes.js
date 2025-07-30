import express from 'express';
import {
  register,
  googleLogin,
  login,
  refresh,
  getProfile,
  updateProfile,
  addReview,
  deleteUserController,
  getPublicProfile,
  getLikedRelics
} from '../controllers/authController.js';
import { authenticate, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { updateUserProfile } from '../services/authService.js';
import { validateUserUpdate } from '../validations/userValidations.js';
import User from '../models/User.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/google', googleLogin);
router.post('/login', login);
router.post('/refresh', refresh);

// Profile routes
router.post('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, upload.single('profilePicture'), updateProfile);
router.post('/reviews', authenticate, addReview);
router.delete('/users/:userId', authenticate, deleteUserController);
router.get('/users/:userId/liked-relics', authenticate, getLikedRelics);
router.get('/users/:userId', getPublicProfile);

// Admin routes
router.get('/admin/users', authenticate, restrictTo('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const users = await User.find()
      .select('_id name lastname location username email role profilePicture')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page
    });
    
  } catch (err) {
    next({ status: 500, message: err.message });
  }
});

router.patch('/admin/users/:userId', authenticate, restrictTo('admin'), upload.single('profilePicture'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = { ...req.body };

    // Handle profile picture
    if (req.file) {
      updates.profilePicture = `/uploads/${req.file.filename}`;
    }
    
    // Validate updates
    const { error } = validateUserUpdate(updates);
    if (error) {      
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }

    // Update user
    const user = await updateUserProfile(userId, updates);
    res.status(200).json(user);    
  } catch (err) {    
    next({ status: err.status || 500, message: err.message });
  }
});

export default router;