import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const simulationSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    seed: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    sourceWindow: {
      type: String,
      default: 'latest',
    },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const SimulationSession = model('SimulationSession', simulationSessionSchema);
