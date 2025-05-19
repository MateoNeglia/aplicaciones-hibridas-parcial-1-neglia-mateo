import User from '../models/User.js';
import Relic from '../models/Relic.js';

const createRelic = async (user, {niche, year, name, description, condition, set, picture}) => {

    const relic = new Relic({
      owner: user._id,
      niche,
      year: year ? parseInt(year) : undefined,
      name,
      description,
      condition,
      set,
      picture: picture || undefined,
    });
    await relic.save();

    let reliquaryList = user.reliquaryLists.find(
      (list) =>
        list.niche.category === niche.category &&
        list.niche.specific === niche.specific
    );
    if (!reliquaryList) {
      reliquaryList = {
        niche: { category: niche.category, specific: niche.specific },
        relics: [],
      };
      user.reliquaryLists.push(reliquaryList);
    }
    reliquaryList.relics.push(relic._id);
    await user.save();

    return relic;
};

const updateRelic = async (relic, userId,  { niche, year, name, description, condition, set, picture }) => {  
    //hace un update de los cambios si hay
    relic.name = name;
    relic.condition = condition;
    relic.description = description || undefined;
    relic.year = year ? parseInt(year) : undefined;
    relic.set = set || undefined;
    relic.picture = picture || undefined;

    //maneja el cambio de nicho
    if (niche && (niche.category !== relic.niche.category || niche.specific !== relic.niche.specific)) {
      const user = await User.findById(userId);
      
      //remueve la reliquia de la lista de reliquias anterior
      const oldList = user.reliquaryLists.find(
        (list) =>
          list.niche.category === relic.niche.category &&
          list.niche.specific === relic.niche.specific
      );
      if (oldList) {
        oldList.relics = oldList.relics.filter((id) => id.toString() !== relic._id.toString());
      }

      //Agrega la reliquia a la nueva lista
      let newList = user.reliquaryLists.find(
        (list) =>
          list.niche.category === niche.category &&
          list.niche.specific === niche.specific
      );
      if (!newList) {
        newList = {
          niche: { category: niche.category, specific: niche.specific },
          relics: [],
        };
        user.reliquaryLists.push(newList);
      }
      newList.relics.push(relic._id);

      await user.save();
      relic.niche = niche;
    }
    //guarda los cambios realizados en la reliquia
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
    const reliquaryList = user.reliquaryLists.find((list) =>
      list.relics.includes(relicId)
    );
    if (reliquaryList) {
      reliquaryList.relics = reliquaryList.relics.filter(
        (id) => id.toString() !== relicId
      );
      
      // user.reliquaryLists = user.reliquaryLists.filter(
      //   (list) => list.relics.length > 0
      // );
      await user.save();
    }

    //borra la reliquia
    return await Relic.findByIdAndDelete(relicId);
};

export {
  createRelic,
  updateRelic,
  deleteRelic,
};
