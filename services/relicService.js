import User from '../models/User.js';
import Relic from '../models/Relic.js';

const createRelic = async (user, req) => {
  const { niche, name, description, year, condition, set } = req.body;
  const picture = req.file ? `/uploads/${req.file.filename}` : undefined;

  const relic = new Relic({
    owner: user._id,
    niche,
    year: year ? parseInt(year) : undefined,
    name,
    description: description || undefined,
    condition: condition || undefined,
    set: set || undefined,
    picture,
  });
  await relic.save();

  const nicheExistsInUser = user.niches.some(
    (n) => n.category === niche.category && n.specific === niche.specific
  );
  if (!nicheExistsInUser) {
    user.niches.push({
      category: niche.category,
      specific: niche.specific,
    });
  }

  let reliquaryList = user.reliquaryLists.find(
    (list) => list.niche.category === niche.category && list.niche.specific === niche.specific
  );
  if (!reliquaryList) {
    user.reliquaryLists.push({
      niche: { category: niche.category, specific: niche.specific },
      relics: [relic._id],
    });
  } else {
    reliquaryList.relics.push(relic._id);
  }

  user.markModified('niches');
  user.markModified('reliquaryLists');
  await user.save();

  return relic;
};

const updateRelic = async (relic, userId, { niche, year, name, description, condition, set, picture }) => {  
  if (niche) {
    const user = await User.findById(userId);
    const nicheExistsInUser = user.niches.some(
      (n) => n.category === niche.category && n.specific === niche.specific
    );
    if (!nicheExistsInUser) {
      user.niches.push({
        category: niche.category,
        specific: niche.specific,
      });
      user.markModified('niches');
    }

    if (niche.category !== relic.niche.category || niche.specific !== relic.niche.specific) {
      const oldList = user.reliquaryLists.find(
        (list) => list.niche.category === relic.niche.category && list.niche.specific === relic.niche.specific
      );
      if (oldList) {
        oldList.relics = oldList.relics.filter((id) => id.toString() !== relic._id.toString());
      }

      let newList = user.reliquaryLists.find(
        (list) => list.niche.category === niche.category && list.niche.specific === niche.specific
      );
      if (!newList) {
        newList = {
          niche: { category: niche.category, specific: niche.specific },
          relics: [],
        };
        user.reliquaryLists.push(newList);
      }
      newList.relics.push(relic._id);

      user.markModified('reliquaryLists');
      relic.niche = niche;
    }
    await user.save();
  }

  relic.name = name || relic.name;
  relic.condition = condition || relic.condition;
  relic.description = description || undefined;
  relic.year = year ? parseInt(year) : relic.year;
  relic.set = set || relic.set;
  relic.picture = picture || undefined;

  await relic.save();
  return relic;
};

const deleteRelic = async (relicId, userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  const reliquaryList = user.reliquaryLists.find((list) => list.relics.includes(relicId));
  if (reliquaryList) {
    reliquaryList.relics = reliquaryList.relics.filter((id) => id.toString() !== relicId);
    user.markModified('reliquaryLists');
    await user.save();
  }

  return await Relic.findByIdAndDelete(relicId);
};

export {
  createRelic,
  updateRelic,
  deleteRelic,
};
