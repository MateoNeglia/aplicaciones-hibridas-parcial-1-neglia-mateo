import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import relicRoutes from './relicRoutes.js';
import nicheRoutes from './nicheRoutes.js';
import authRoutes from './authRoutes.js';
import { chatRouter } from './chatRoutes.js';
import  { messageRouter } from './messageRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/relics', relicRoutes);
router.use('/niche', nicheRoutes);
router.use('/chats', authenticate, chatRouter);
router.use('/messages', authenticate, messageRouter);


export default router;