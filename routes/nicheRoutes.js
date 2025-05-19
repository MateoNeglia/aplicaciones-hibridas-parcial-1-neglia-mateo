import express from 'express';
import { getNiches, getCustomNiches, approveCustomNiche } from '../controllers/nicheController.js';
import { authenticate, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/niches', getNiches);
router.get('/custom-niches', authenticate, restrictTo('admin'), getCustomNiches);
router.post('/approve-niche', authenticate, restrictTo('admin'), approveCustomNiche);
export default router;