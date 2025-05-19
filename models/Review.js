import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del usuario reseñado es obligatorio'],
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del reseñador es obligatorio'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'El rating es obligatorio'],
      min: [1, 'Rating no puede ser menor a 1'],
      max: [5, 'Rating no puede ser mayor a 5'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ reviewedUserId: 1, reviewerId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);