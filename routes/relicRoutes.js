import express from 'express';
import {
  create,
  update,
  remove,
  getUserReliquary,
  likeRelic,
  getRelics,   
  getRelicById,
} from '../controllers/relicController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/add', authenticate, create);
router.get('/reliquary/:userId', getUserReliquary);
router.post('/relics/:relicId/like', authenticate, likeRelic);
router.get('/', getRelics);
router.delete('/:relicId', authenticate, remove);
router.put('/:relicId', authenticate, update);
router.get('/:relicId', authenticate, getRelicById); 

export default router;