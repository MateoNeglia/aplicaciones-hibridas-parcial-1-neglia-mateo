import mongoose from 'mongoose';

const relicSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    niche: {
      category: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
      },
      specific: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },
    },
    year: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    condition: {
      type: String,
      enum: [
        'Perfecto Estado',
        'Casi Perfecto Estado',
        'Ligeramente Usado',
        'Moderadamente Usado',
        'Muy Usado',
        'Desgastado',
        'Dañado',
      ],
      required: true,
    },
    set: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    picture: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          if (!value) return true;          
          return /^(\/Uploads\/[\w\s-]+\.[\w]+|https?:\/\/([\w-]+\.)+[\w-]+(\/[\w\s-./?%&=]*)?\.[\w]+)$/i.test(value);
        },
        message: 'Formato de imagen inválido. Debe ser una ruta local (/uploads/filename.ext) o URL válida (http(s)://.../filename.ext).',
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

relicSchema.pre('validate', async function (next) {
  try {
    const Niche = mongoose.model('Niche');
    const nicheDocs = await Niche.find({}).lean();
    const validNiches = nicheDocs.reduce((acc, doc) => {
      acc[doc.category] = doc.specifics;
      return acc;
    }, {});
    if (
      !validNiches[this.niche.category] ||
      !validNiches[this.niche.category].includes(this.niche.specific)
    ) {
      return next(new Error('Nicho inválido'));
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('Relic', relicSchema);