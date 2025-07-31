import express from 'express';
import {
  create,
  update,
  remove,
  getUserReliquary,
  likeRelic,
  getRelics,   
  getRelicById,
  getSuggestions,
  getAllRelicsForAdmin
} from '../controllers/relicController.js';
import { authenticate, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public and user-specific routes
router.post('/add', authenticate, upload.single('picture'), create);
router.get('/reliquary/:userId', authenticate, getUserReliquary);
router.post('/:relicId/like', authenticate, likeRelic);
router.get('/', getRelics);
router.get('/suggestions', authenticate, getSuggestions);
router.delete('/:relicId', authenticate, remove);
router.patch('/:relicId', authenticate, upload.single('picture'), update);
router.get('/:relicId', authenticate, getRelicById);

// Admin routes
router.get('/admin/relics', authenticate, restrictTo('admin'), getAllRelicsForAdmin);

export default router;