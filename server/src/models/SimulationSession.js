import mongoose from 'mongoose';

const simulationSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // 1-to-1 relationship per user for MVP
    },
    seed: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner',
    },
    mode: {
      type: String,
      enum: ['simulated', 'real'],
      default: 'simulated',
    },
    sourceWindow: {
      type: String,
      default: '1d', // e.g., ties back to historical interval
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const SimulationSession = mongoose.model('SimulationSession', simulationSessionSchema);
