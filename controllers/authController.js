import {
  registerUser,
  googleAuth,
  loginUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  deleteUser, 
} from '../services/authService.js';
import { validateUserCreation, validateLogin, validateUserUpdate } from '../validations/userValidations.js';


const register = async (req, res, next) => {
  try {
    //estoy validando el body que me llegó en el request usando la validación que hice en Joi
    const { error } = validateUserCreation(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }

    const { name, lastname, username, email, password, role } = req.body;

    const result = await registerUser({ name, lastname, username, email, password, role });

    res.status(201).json(result);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const login = async (req, res, next) => {
  try {
    
    const { error } = validateLogin(req.body);
    if (error) {
      console.log('Validation errors:', error.details);
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

const updateProfile = async (req, res, next) => {
  try {
    const { error } = validateUserUpdate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }
    const user = await updateUserProfile(req.user._id, req.body);
    res.status(200).json(user);
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


//El google login es un placeholder, ya que no tengo la implementación de google auth aún
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
  deleteUserController 
};