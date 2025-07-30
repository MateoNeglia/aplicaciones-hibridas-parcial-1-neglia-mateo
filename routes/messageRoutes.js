import express from 'express';
import { createMessage, getMessages } from '../controllers/messageController.js';
import { authenticate } from '../middleware/authMiddleware.js'; 

const messageRouter = express.Router();

messageRouter.post('/', authenticate, createMessage);
messageRouter.get('/:chatId', authenticate, getMessages);


export { messageRouter };