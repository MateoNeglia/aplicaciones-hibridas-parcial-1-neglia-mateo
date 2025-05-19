import mongoose from 'mongoose';
import Niche from './Niche.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    lastname: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      select: false,
    },
    location: {
      city: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
    },
    rating: {
      type: Number,
      default: 0,
    },
    niches: [
      {
        category: { type: String, trim: true },
        specific: { type: String, trim: true },
        isCustom: { type: Boolean, default: false },
      },
    ],
    reliquaryLists: [
      {
        niche: {
          category: { type: String, trim: true },
          specific: { type: String, trim: true },
        },
        relics: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Relic',
          },
        ],
      },
    ],
    role: {
      type: String,
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', function (next) {
  if (this.isNew && !this.password && !this.googleId) {
    return next(new Error('Tanto la contraseña como el ID de Google son obligatorios'));
  }
  next();
});

userSchema.pre('validate', async function (next) {
  try {
    const nicheDocs = await Niche.find({}).lean();
    const validNiches = nicheDocs.reduce((acc, doc) => {
      acc[doc.category] = doc.specifics;
      return acc;
    }, {});
    for (const niche of this.niches) {
      if (!niche.isCustom) {
        if (!validNiches[niche.category] || !validNiches[niche.category].includes(niche.specific)) {
          return next(new Error(`Nicho Inválido: ${niche.category} - ${niche.specific}`));
        }
      } else {
        if (!niche.category || niche.category.length < 2 || niche.category.length > 50) {
          return next(new Error('La categoría del nicho personalizado debe tener entre 2 y 50 caracteres'));
        }
        if (!niche.specific || niche.specific.length < 2 || niche.specific.length > 100) {
          return next(new Error('El nicho específico del nicho personalizado debe tener entre 2 y 100 caracteres'));
        }
      }
    }
    for (const list of this.reliquaryLists) {
      if (!validNiches[list.niche.category] || !validNiches[list.niche.category].includes(list.niche.specific)) {
        return next(new Error(`Lista de nicho en relicario inválido: ${list.niche.category} - ${list.niche.specific}`));
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('User', userSchema);