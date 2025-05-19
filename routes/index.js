import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
//import userRoutes from './userRoutes.js';
import relicRoutes from './relicRoutes.js';
import nicheRoutes from './nicheRoutes.js';
import authRoutes from './authRoutes.js';
const router = express.Router();

router.use('/auth', authRoutes);
//router.use('/users', authenticate, userRoutes);
router.use('/relics', authenticate, relicRoutes);
router.use('/niche', nicheRoutes);

export default router;