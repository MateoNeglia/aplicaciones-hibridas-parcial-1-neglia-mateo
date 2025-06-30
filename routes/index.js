import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import relicRoutes from './relicRoutes.js';
import nicheRoutes from './nicheRoutes.js';
import authRoutes from './authRoutes.js';
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/relics', relicRoutes);
router.use('/niche', nicheRoutes);

export default router;