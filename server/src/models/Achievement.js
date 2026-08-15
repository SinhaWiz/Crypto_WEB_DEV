import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const achievementSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Each achievement code can only be unlocked once per user
achievementSchema.index({ userId: 1, code: 1 }, { unique: true });

export const Achievement = model('Achievement', achievementSchema);
