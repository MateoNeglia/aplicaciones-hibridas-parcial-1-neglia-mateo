import {
  registerUser,
  googleAuth,
  loginUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  addUserReview,
  deleteUser,
  getUserPublicProfile
} from '../services/authService.js';
import User from '../models/User.js';
import { validateUserCreation, validateLogin, validateUserUpdate, validateUserReview } from '../validations/userValidations.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });



const register = async (req, res, next) => {
  try {
    const { error } = validateUserCreation(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }

    const { username, email, password, role } = req.body;

    const result = await registerUser({ username, email, password, role });

    res.status(201).json(result);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const login = async (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {      
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }

    const { identifier, password } = req.body;

    const result = await loginUser({ identifier, password });

    res.status(200).json(result);
  } catch (err) {
    console.error('Login error:', err);
    next({ status: err.status || 500, message: err.message });
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'El token de refresh es requerido' });
    }
    const accessToken = await refreshAccessToken(refreshToken);
    res.status(200).json({ accessToken });
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const getProfile = async (req, res, next) => {  
  try {
    const user = await getUserProfile(req.user._id);
    res.status(200).json(user);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await getUserPublicProfile(userId);
    res.status(200).json(user);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.file) {      
      updates.profilePicture = req.file.path;
    }
    const { error } = validateUserUpdate(updates);
    if (error) {
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }
    const user = await updateUserProfile(req.user._id, updates);
    res.status(200).json(user);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const addReview = async (req, res, next) => {
  try {
    const { error } = validateUserReview(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }
    const { targetUserId, rating, comment } = req.body;
    const reviewerId = req.user._id;
    const user = await addUserReview(targetUserId, reviewerId, { rating, comment });
    res.status(200).json(user);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const getLikedRelics = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('likedRelics');
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    res.status(200).json(user.likedRelics);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const deleteUserController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const authenticatedUser = await getUserProfile(req.user._id);

    if (authenticatedUser._id.toString() !== userId && authenticatedUser.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own account or must be an admin' });
    }

    await deleteUser(userId);
    res.status(200).json({ message: 'User and associated relics deleted successfully' });
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, name, lastname } = req.body;
    if (!googleId || !email || !name) {
      return res.status(400).json({ message: 'Google ID, email, and name are required' });
    }
    const result = await googleAuth({ googleId, email, name, lastname });
    res.status(200).json(result);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

export {
  register,
  googleLogin,
  login,
  refresh,
  getProfile,
  updateProfile,
  addReview,
  deleteUserController,
  getPublicProfile,
  getLikedRelics
};