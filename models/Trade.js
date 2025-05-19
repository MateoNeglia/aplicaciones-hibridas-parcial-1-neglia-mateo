import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El User ID es obligatorio'],
      index: true,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'EL Partner ID es obligatorio'],
      index: true,
    },
    relicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Relic',
        required: [true, 'El id de la reliquia es obligatorio'],
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Trade', tradeSchema);