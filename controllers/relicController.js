import User from '../models/User.js';
import Relic from '../models/Relic.js';
import Niche from '../models/Niche.js';
import { createRelic, updateRelic, deleteRelic } from '../services/relicService.js';
import { validateRelicUpdate, validateRelicCreation } from '../validations/relicValidations.js';

//funciones ABM de reliquias
const create = async (req, res, next) => {
  try {
    const relicData = JSON.parse(req.body.relic);
    const { error } = validateRelicCreation(relicData);
    if (error) {
      return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
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

    const user = await User.findById(req.user._id);
    const result = await createRelic(user, { ...req, body: relicData });
    res.status(201).json(result);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const update = async (req, res, next) => {  
  try {
    const { relicId } = req.params;
    const userId = req.user._id;
    
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

    if (relic.owner.toString() !== userId.toString()) {
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

const remove = async (req, res, next) => {
  try {
    const { relicId } = req.params;
    const userId = req.user._id;

    //busca la reliquia
    const relic = await Relic.findById(relicId);
    if (!relic) {
      const error = new Error('Relic not found');
      error.status = 404;
      throw error;
    }

    //verifica al owner
    if (relic.owner.toString() !== userId.toString()) {
      const error = new Error('You can only delete your own relics');
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

//---------------------------------------------------------------//

//Funciones para obtener datos existentes en las reliquias
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

    //validacion
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
    const relic = await Relic.findById(req.params.relicId);
    if (!relic) {
      const error = new Error('No se encontró la reliquia');
      error.status = 404;
      throw error;
    }
    if (relic.owner.toString() === req.user._id.toString()) {
      const error = new Error('No te puedes dar like a tu propia reliquia');
      error.status = 400;
      throw error;
    }
    if (relic.likes.includes(req.user._id)) {
      relic.likes = relic.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      relic.likes.push(req.user._id);
    }
    await relic.save();
    res.status(200).json(relic);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};



//---------------------------------------------------------------//
//*
//* Este es el endpoint que se encarga de buscar las reliquias en la base de datos, tiene varios comentarios por cada sección
//* para hacer más fácil la lectura y entendimiento de lo que hace cada parte cuando se le tenga que hacer alguna modificación
//* o update en el futuro. También es la lógica más compleja y central de la APP :)
//*
const getRelics = async (req, res, next) => {
  try {
    const { page = 1, limit = 6, category, specific, condition, name, sortBy = 'createdAt', order = 'desc' } = req.query;

    //Acá estás creando el objeto query para el filtrado
    const query = {};
    if (category) query['niche.category'] = category;
    if (specific) query['niche.specific'] = specific;
    if (condition) query.condition = condition;
    if (name) query.name = { $regex: name, $options: 'i' };

    //Acá estas armando el setup de la paginacion
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    //Acá estas definiendo el orden que se tiene que aplicar para el campo condition
    const conditionOrder = [
      'Perfecto Estado',
      'Casi Perfecto Estado',
      'Ligeramente Usado',
      'Moderadamente Usado',
      'Muy Usado',
      'Desgastado',
      'Dañado',
    ];


    //Y este es un objeto donde estamos armando el mapeo que vamos a usar para los campos que estamos metiendo en el sort
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

    //Acá estamos validando el sortBy y el order
    
    const allowedSortBy = Object.keys(sortByMapping);
    const selectedSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
    const selectedOrder = ['asc', 'desc'].includes(order) ? order : 'desc';
    const sortField = sortByMapping[selectedSortBy];
    const sortOrder = selectedOrder === 'asc' ? 1 : -1;

    //El pipeline de lo que agregaste que se va a buscar en la base de datos
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
      { $unwind: '$owner' }, // pasa de un array a un objeto
      {
        $addFields: {
          likesCount: { $size: '$likes' }, // agrega el campo likesCount para contar los likes
          conditionOrder: {
            $indexOfArray: [conditionOrder, '$condition'], //mapea la condición de a cuerdo q lo que declaraste más arriba
          },
        },
      },
      { $sort: { [sortField]: sortOrder } }, // el orden que se va a aplicar el sort
      { $skip: skip },                        // el skip de la paginacion
      { $limit: limitNum },                   //el límite de la paginacion
    ];

    //ejecuta el pipeline
    const relics = await Relic.aggregate(pipeline).exec();

    //Acá estás contando el total de documentos que cumplen con la query :)
    const total = await Relic.countDocuments(query);

    //y finalmente devolves el resultado para el buscador delfront :)
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

//---------------------------------------------------------------//
// New suggestions endpoint
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



export { create, update, remove, getUserReliquary, likeRelic, getRelics, getRelicById, getSuggestions };