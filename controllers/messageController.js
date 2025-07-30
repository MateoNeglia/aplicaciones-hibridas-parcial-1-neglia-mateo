import  Messages  from "../models/Messages.js";

const createMessage = async (req, res, next) => {
  try {
    const { chatId, senderId, text } = req.body;

    if (!chatId || !senderId || !text) {
      return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    const newMessage = new Messages({
      chatId,
      senderId,
      text
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
}

const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    if (!chatId) {
      return res.status(400).json({ message: "Se requiere un ID de chat." });
    }

    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
}

export { createMessage, getMessages };