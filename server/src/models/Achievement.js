import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const achievementSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      enum: ['first_trade', 'first_prediction', 'portfolio_builder', 'prediction_winner'],
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, code: 1 }, { unique: true });

export const Achievement = model('Achievement', achievementSchema);
