import express from 'express';
import {createChat, findUserChats, findChat, findChatById} from '../controllers/chatController.js';

const chatRouter = express.Router();

chatRouter.post('/', createChat);
chatRouter.get('/:userId', findUserChats);
chatRouter.get('/:firstId/:secondId', findChat);
chatRouter.get('/by-id/:chatId', findChatById);

export {chatRouter};