import mongoose from 'mongoose';
import Niche from './Niche.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    lastname: {
      type: String,
      trim: true,
      default: '',
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
    profilePicture: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /^(\/uploads\/[\w\s-]+\.[\w]+|https?:\/\/([\w-]+\.)+[\w-]+(\/[\w\s-./?%&=]*)?\.[\w]+)$/i.test(value);
        },
        message: 'Formato de imagen inválido. Debe ser una ruta local (/uploads/filename.ext) o URL válida (http(s)://.../filename.ext).',
      },
      default: '',
    },
    reviews: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: [true, 'Reviewer is required'],
        },
        rating: {
          type: Number,
          required: [true, 'Rating is required'],
          min: [1, 'Rating must be at least 1'],
          max: [5, 'Rating cannot exceed 5'],
        },
        comment: {
          type: String,
          trim: true,
          maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

// Virtual field for average rating
userSchema.virtual('rating').get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / this.reviews.length) * 10) / 10; 
});

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
    // Validate reviews
    if (this.reviews && this.reviews.length > 0) {
      const reviewerIds = this.reviews.map(review => review.reviewer.toString());
      // Check for duplicate reviewers
      if (new Set(reviewerIds).size !== reviewerIds.length) {
        return next(new Error('A user can only leave one review'));
      }
      // Prevent self-reviews
      if (reviewerIds.includes(this._id.toString())) {
        return next(new Error('Users cannot review themselves'));
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('User', userSchema);