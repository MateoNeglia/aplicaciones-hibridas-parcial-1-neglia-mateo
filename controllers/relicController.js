
import User from '../models/User.js';
import Relic from '../models/Relic.js';
import Niche from '../models/Niche.js';
import { createRelic, updateRelic, deleteRelic } from '../services/relicService.js';
import { validateRelicUpdate, validateRelicCreation } from '../validations/relicValidations.js';

// Create a relic (admins can specify owner)
const create = async (req, res, next) => {
  try {
    const relicData = JSON.parse(req.body.relic);
    const { error } = validateRelicCreation(relicData);
    if (error) {
      return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
    }
    
    let ownerId = req.user._id;
    if (req.user.role === 'admin' && req.body.ownerId) {
      ownerId = req.body.ownerId;
    }
    
    const owner = await User.findById(ownerId);
    if (!owner) {
      const error = new Error('Owner not found');
      error.status = 404;
      throw error;
    }
    
    let niche = await Niche.findOne({ category: relicData.niche.category });
    if (!niche) {
      niche = new Niche({
        category: relicData.niche.category,
        specifics: [relicData.niche.specific],
      });
      await niche.save();
    } else if (!niche.specifics.includes(relicData.niche.specific)) {
      niche.specifics.push(relicData.niche.specific);
      await niche.save();
    }

    const result = await createRelic(owner, { ...req, body: relicData });
    res.status(201).json(result);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

// Update a relic (admins can edit any relic)
const update = async (req, res, next) => {  
  try {
    const { relicId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const updateData = { ...req.body };

    if (req.body['niche[category]'] && req.body['niche[specific]']) {
      updateData.niche = {
        category: req.body['niche[category]'],
        specific: req.body['niche[specific]'],
      };
    }
    
    const relic = await Relic.findById(relicId);
    if (!relic) {
      const error = new Error('Relic not found');
      error.status = 404;
      throw error;
    }
    updateData.picture = req.file ? `/uploads/${req.file.filename}` : (req.body.picture || relic.picture);

    const { error } = validateRelicUpdate(updateData);
    if (error) {
      return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
    }

    if (userRole !== 'admin' && relic.owner.toString() !== userId.toString()) {
      const error = new Error('Solo puedes editar tus propias reliquias');
      error.status = 403;
      throw error;
    }
    
    if (updateData.niche) {
      const niche = updateData.niche;
      let nicheDoc = await Niche.findOne({ category: niche.category });
      if (!nicheDoc) {
        nicheDoc = new Niche({
          category: niche.category,
          specifics: [niche.specific],
        });
        await nicheDoc.save();
      } else if (!nicheDoc.specifics.includes(niche.specific)) {
        nicheDoc.specifics.push(niche.specific);
        await nicheDoc.save();
      }
    }

    const result = await updateRelic(relic, userId, updateData);
    res.status(200).json(result);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

// Delete a relic (admins can delete any relic)
const remove = async (req, res, next) => {
  try {
    const { relicId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const relic = await Relic.findById(relicId);
    if (!relic) {
      const error = new Error('Relic not found');
      error.status = 404;
      throw error;
    }

    if (userRole !== 'admin' && relic.owner.toString() !== userId.toString()) {
      const error = new Error('Solo puedes eliminar tus propias reliquias');
      error.status = 403;
      throw error;
    }
    
    const result = await deleteRelic(relicId, userId);
    if (!result) {
      const error = new Error('No se pudo eliminar la reliquia');
      error.status = 500;
      throw error;
    }

    res.status(200).json({ message: 'Se borró la reliquia exitosamente' });
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

// Get all relics for admin with pagination
const getAllRelicsForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalRelics = await Relic.countDocuments();
    const relics = await Relic.find()
      .select('_id name description niche condition picture owner')
      .populate('owner', 'username')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      relics,
      totalRelics,
      totalPages: Math.ceil(totalRelics / limit),
      currentPage: page
    });
  } catch (err) {
    next({ status: 500, message: err.message });
  }
};

// Existing functions (unchanged for this context)
const getUserReliquary = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('reliquaryLists.relics')
      .lean();
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }
    res.status(200).json(user.reliquaryLists);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const getRelicById = async (req, res, next) => {
  try {
    const { relicId } = req.params;

    if (!relicId.match(/^[0-9a-fA-F]{24}$/)) {
      const error = new Error('ID inválido');
      error.status = 400;
      throw error;
    }

    const relic = await Relic.findById(relicId)
      .populate('owner', 'username') 
      .lean();

    if (!relic) {
      const error = new Error('No se encontró la reliquia');
      error.status = 404;
      throw error;
    }

    res.status(200).json(relic);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const likeRelic = async (req, res, next) => {
  try {
    const relic = await Relic.findById(req.params.relicId).populate('owner', 'username');
    if (!relic) {
      const error = new Error('No se encontró la reliquia');
      error.status = 404;
      throw error;
    }
    if (relic.owner._id.toString() === req.user._id.toString()) {
      const error = new Error('No te puedes dar like a tu propia reliquia');
      error.status = 400;
      throw error;
    }
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (relic.likes.includes(userId)) {
      relic.likes = relic.likes.filter((id) => id.toString() !== userId.toString());
      user.likedRelics = user.likedRelics.filter((id) => id.toString() !== relic._id.toString());
    } else {
      relic.likes.push(userId);
      user.likedRelics.push(relic._id);
    }
    await relic.save();
    await user.save();
    const updatedRelic = await Relic.findById(req.params.relicId).populate('owner', 'username');
    res.status(200).json(updatedRelic);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

// //---------------------------------------------------------------//
// //*
// //* Este es el endpoint que se encarga de buscar las reliquias en la base de datos, tiene varios comentarios por cada sección
// //* para hacer más fácil la lectura y entendimiento de lo que hace cada parte cuando se le tenga que hacer alguna modificación
// //* o update en el futuro. También es la lógica más compleja y central de la APP :)
// //*
// //--andando

const getRelics = async (req, res, next) => {
  try {
    const { page = 1, limit = 6, category, specific, condition, name, sortBy = 'createdAt', order = 'desc', recommend } = req.query;

    let userNiches = [];
    if (recommend === 'true' && req.user?._id) {
      const user = await User.findById(req.user._id).lean();
      if (user?.niches) {
        userNiches = user.niches;
      }
    }

    const query = {};
    if (category) {
      query['niche.category'] = category;
    } else if (recommend === 'true' && userNiches.length > 0) {
      query['niche.category'] = { $in: userNiches.map(n => n.category) };
      query['niche.specific'] = { $in: userNiches.map(n => n.specific) };
    }
    if (specific) query['niche.specific'] = specific;
    if (condition) query.condition = condition;
    if (name) query.name = { $regex: name, $options: 'i' };
    if (recommend === 'true' && req.user?._id) {
      query.owner = { $ne: req.user._id };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const conditionOrder = [
      'Perfecto Estado',
      'Casi Perfecto Estado',
      'Ligeramente Usado',
      'Moderadamente Usado',
      'Muy Usado',
      'Desgastado',
      'Dañado',
    ];

    const sortByMapping = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      likes: 'likesCount',
      ownerName: 'owner.username',
      year: 'year',
      set: 'set',
      condition: 'conditionOrder',
      name: 'name',
    };

    const allowedSortBy = Object.keys(sortByMapping);
    const selectedSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
    const selectedOrder = ['asc', 'desc'].includes(order) ? order : 'desc';
    const sortField = sortByMapping[selectedSortBy];
    const sortOrder = selectedOrder === 'asc' ? 1 : -1;

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner',
        },
      },
      { $unwind: '$owner' },
      {
        $addFields: {
          likesCount: { $size: '$likes' },
          conditionOrder: {
            $indexOfArray: [conditionOrder, '$condition'],
          },
        },
      },
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limitNum },
    ];

    const relics = await Relic.aggregate(pipeline).exec();
    const total = await Relic.countDocuments(query);

    res.status(200).json({
      relics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};
  
const getSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }
    const suggestions = await Relic.find({
      name: { $regex: query, $options: 'i' },
    })
      .limit(5)
      .select('name')
      .distinct('name')
      .lean();
    res.json(suggestions);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

export { create, update, remove, getUserReliquary, likeRelic, getRelics, getRelicById, getSuggestions, getAllRelicsForAdmin };