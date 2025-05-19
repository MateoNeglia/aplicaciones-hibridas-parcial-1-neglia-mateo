import mongoose from 'mongoose';

const nicheSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Category must be at least 2 characters'],
    maxlength: [50, 'Category cannot exceed 50 characters'],
  },
  specifics: [
    {
      type: String,
      required: [true, 'Specific niche is required'],
      trim: true,
      minlength: [2, 'Specific niche must be at least 2 characters'],
      maxlength: [100, 'Specific niche cannot exceed 100 characters'],
    },
  ],
});

export default mongoose.model('Niche', nicheSchema);