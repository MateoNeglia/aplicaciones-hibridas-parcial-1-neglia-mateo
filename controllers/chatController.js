import { get } from "mongoose";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

const createChat = async (req, res, next) => {
  try {

    const { firstId, secondId } = req.body;
    if (!firstId || !secondId) {
        return res.status(400).json({ message: "Se requieren dos IDs de usuario para crear un chat." });
    }

    const chat = await Chat.findOne({
      members: { $all: [firstId, secondId] }
    });

    if (chat) {
      return res.status(200).json(chat);
    }

    const newChat = new Chat({
      members: [firstId, secondId]
    });
    
    const response = await newChat.save();    
    res.status(201).json(response);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
}

const findUserChats = async (req, res, next) => {  
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Se requiere un ID de usuario." });
    }

    const chats = await Chat.find({ 
        members: {$in : [userId] }
    });
    

    let filteredChats = await Promise.all(chats.map(async (chat) => {
      let memberData = chat.members = chat.members.filter(member => member.toString() !== userId);
      memberData = await getMemberData(chat);
      return {
        ...chat._doc,
        members: memberData
      };  
    }));
        

    res.status(200).json(filteredChats);

  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
}

const findChat = async (req, res, next) => {
  
  try {
    const { firstId, secondId } = req.params;

    if (!firstId || !secondId) {
      return res.status(400).json({ message: "Se requieren dos IDs de usuario para encontrar un chat." });
    }

    const chat = await Chat.findOne({
      members: { $all: [firstId, secondId] }
    });
    if (!chat) {
      return res.status(404).json({ message: "Chat no encontrado." });
    }
    
    res.status(200).json(chat);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
}

const findChatById = async (req, res, next) => {
  
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "Se requiere un ID de chat." });
    }  
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat no encontrado." });
    }

    let memberData = await getMemberData(chat);
    chat.members = memberData;

    res.status(200).json(chat);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
}

const getMemberData = async (chat) => {  
  const memberIds = chat.members;   
  const members = await User.find({ _id: { $in: memberIds } }, 'name lastname profilePicture username');
  
  return members.map(member => ({
    id: member._id,
    name: member.name,
    lastname: member.lastname,
    profilePicture: member.profilePicture,
    username: member.username
  }));  
}

export { createChat, findUserChats, findChat, findChatById ,getMemberData };