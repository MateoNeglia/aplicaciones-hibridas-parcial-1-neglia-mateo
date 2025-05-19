import User from '../models/User.js';
import Niche from '../models/Niche.js';

const getNiches = async (req, res, next) => {
  try {
    const nicheDocs = await Niche.find({}).lean();
    const nicheTaxonomy = nicheDocs.reduce((acc, doc) => {
      acc[doc.category] = doc.specifics;
      return acc;
    }, {});
    res.status(200).json(nicheTaxonomy);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const getCustomNiches = async (req, res, next) => {
  try {
    const users = await User.find({ 'niches.isCustom': true }).select('niches');
    const customNiches = users
      .flatMap(user => user.niches.filter(niche => niche.isCustom))
      .map(niche => ({ category: niche.category, specific: niche.specific }));
    res.status(200).json(customNiches);
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

const approveCustomNiche = async (req, res, next) => {
  try {
    const { category, specific } = req.body;
    if (!category || !specific) {
      const error = new Error('Categoría y especificación son obligatorias');
      error.status = 400;
      throw error;
    }

    await Niche.updateOne(
      { category },
      { $addToSet: { specifics: specific } },
      { upsert: true }
    );

    await User.updateMany(
      { 'niches.category': category, 'niches.specific': specific, 'niches.isCustom': true },
      { $set: { 'niches.$[elem].isCustom': false } },
      { arrayFilters: [{ 'elem.category': category, 'elem.specific': specific }] }
    );

    res.status(200).json({ message: 'Nicho aprobado y agregado a la taxonomía' });
  } catch (err) {
    next({ status: err.status || 500, message: err.message });
  }
};

export { getNiches, getCustomNiches, approveCustomNiche };