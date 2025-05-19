import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Relic from '../models/Relic.js'; 

const SALT_ROUNDS = 10;

//registro de usuario
const registerUser = async ({ name, lastname, username, email, password, role }) => {

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const error = new Error('Email or username already exists');
    error.status = 409; 
    throw error;
  }

  //hash
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  //se crea el nuevo usuario
  const user = new User({
    name,
    lastname,
    username,
    email,
    password: hashedPassword,
    role: role || 'user', 
  });

  await user.save();

  //se generan los tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

//login normal
const loginUser = async ({ identifier, password }) => {
  // busca por mail o user
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+password');

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  //chequea la pass
  if (user.password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }
  } else {
    const error = new Error('Use Google Auth for this account');
    error.status = 401;
    throw error;
  }

  // genera tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

//token de refresh
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const accessToken = generateAccessToken(user);
    return accessToken;
  } catch (err) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }
};

//busca por perfil
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return sanitizeUser(user);
};

//update de perfil
const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = ['name', 'lastname', 'username', 'email', 'location', 'niches'];
  const updateKeys = Object.keys(updates);
  const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));
  
  if (!isValidUpdate) {
    const error = new Error('Invalid update fields');
    error.status = 400;
    throw error;
  }

  // chequea si hay conflictos
  if (updates.email || updates.username) {
    const conflict = await User.findOne({
      $or: [{ email: updates.email }, { username: updates.username }],
      _id: { $ne: userId },
    });
    if (conflict) {
      const error = new Error('Email or username already exists');
      error.status = 409;
      throw error;
    }
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return sanitizeUser(user);
};

//Borra al usuario y las relics asociadas a ese user
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  //busca al owner con el id del usuario y llamamos al deleteMany de mongoose
  await Relic.deleteMany({ owner: userId });

  //busca al user y lo borra
  await User.findByIdAndDelete(userId);
};


//registro y login desde Google, esto de momento es un placeholder
// ya que no tengo la implementación de google auth aún
const googleAuth = async ({ googleId, email, name, lastname }) => {
  let user = await User.findOne({ googleId }).select('+googleId');

  if (!user) {    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Email already registered with another method');
      error.status = 409;
      throw error;
    }

    //crea el nuevo usuario
    user = new User({
      name,
      lastname: lastname || '',
      username: email.split('@')[0],
      email,
      googleId,
    });
    await user.save();
  }

  //generar tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};


//---------------------------------------------------------------------------------------------------
//acá tengo funciones que son reutilizadas a lo largo del servicio de auth como por ejemplo la de generar tokens

// genera token
const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

//genera token de refresh
const generateRefreshToken = (user) => {
  return jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

// sanitiza la data antes de devolverla
const sanitizeUser = (user) => {
  const { password, googleId, ...safeUser } = user.toObject();
  return safeUser;
};

export {
  registerUser,
  googleAuth,
  loginUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  deleteUser, 
};