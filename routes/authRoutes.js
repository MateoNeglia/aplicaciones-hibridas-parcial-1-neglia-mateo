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
} from '../controllers/authController.js';
import { authenticate, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
const router = express.Router();


// rutas de auth
router.post('/register', register);
router.post('/google', googleLogin);
router.post('/login', login);
router.post('/refresh', refresh);

// Rutas del perfil
router.post('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, upload.single('profilePicture'), updateProfile);
router.post('/reviews', authenticate, addReview);
router.delete('/users/:userId', authenticate, deleteUserController);

// Rutas del admin
router.get('/admin/users', authenticate, restrictTo('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('_id username email role profilePicture');
    res.status(200).json(users);
  } catch (err) {
    next({ status: 500, message: err.message });
  }
});

export default router;