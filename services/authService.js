import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Relic from '../models/Relic.js';

const SALT_ROUNDS = 10;

const registerUser = async ({ username, email, password, role }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const error = new Error('Email or username already exists');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = new User({
    username,
    email,
    password: hashedPassword,
    role: role || 'user',
    profilePicture: '', 
    reviews: [], 
  });

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const loginUser = async ({ identifier, password }) => {
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+password');

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

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

const getUserProfile = async (userId) => {
  const user = await User.findById(userId).populate('reviews.reviewer', 'username');
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return sanitizeUser(user);
};

const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = ['name', 'lastname', 'username', 'email', 'location', 'niches', 'profilePicture'];
  const updateKeys = Object.keys(updates);
  const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));

  if (!isValidUpdate) {
    const error = new Error('Invalid update fields');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

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

  if (updates.niches) {
    const currentNiches = user.niches.map(n => ({ category: n.category, specific: n.specific }));
    const newNiches = updates.niches.map(n => ({ category: n.category, specific: n.specific }));

    const removedNiches = currentNiches.filter(
      cn => !newNiches.some(nn => nn.category === cn.category && nn.specific === cn.specific)
    );

    for (const removedNiche of removedNiches) {
      await Relic.deleteMany({
        owner: userId,
        'niche.category': removedNiche.category,
        'niche.specific': removedNiche.specific,
      });

      user.reliquaryLists = user.reliquaryLists.filter(
        list => !(list.niche.category === removedNiche.category && list.niche.specific === removedNiche.specific)
      );
    }

    user.niches = updates.niches;
  }

  allowedUpdates.forEach((key) => {
    if (key !== 'niches' && updates[key] !== undefined) {
      user[key] = updates[key];
    }
  });

  user.markModified('reliquaryLists');
  user.markModified('niches');

  await user.save();

  return sanitizeUser(user);
};

const addUserReview = async (targetUserId, reviewerId, { rating, comment }) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    const error = new Error('Target user not found');
    error.status = 404;
    throw error;
  }

  if (targetUserId.toString() === reviewerId.toString()) {
    const error = new Error('Users cannot review themselves');
    error.status = 400;
    throw error;
  }

  const existingReview = user.reviews.find(r => r.reviewer.toString() === reviewerId.toString());
  if (existingReview) {
    const error = new Error('You have already reviewed this user');
    error.status = 400;
    throw error;
  }

  user.reviews.push({
    reviewer: reviewerId,
    rating,
    comment: comment || undefined,
    createdAt: new Date(),
  });

  user.markModified('reviews');
  await user.save();

  return sanitizeUser(user);
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  await Relic.deleteMany({ owner: userId });
  await User.findByIdAndDelete(userId);
};

const googleAuth = async ({ googleId, email, name, lastname }) => {
  let user = await User.findOne({ googleId }).select('+googleId');

  if (!user) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Email already registered with another method');
      error.status = 409;
      throw error;
    }

    user = new User({
      name,
      lastname: lastname || '',
      username: email.split('@')[0],
      email,
      googleId,
      profilePicture: '', 
      reviews: [], 
    });
    await user.save();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

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
  addUserReview,
  deleteUser,
};