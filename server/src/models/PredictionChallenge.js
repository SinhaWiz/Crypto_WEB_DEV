import mongoose from 'mongoose';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const { Schema, model } = mongoose;

const predictionChallengeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      enum: SUPPORTED_SYMBOLS,
    },
    direction: {
      type: String,
      required: true,
      enum: ['up', 'down'],
    },
    pointsStaked: {
      type: Number,
      required: true,
      min: 1,
    },
    startPriceBDT: {
      type: Number,
      required: true,
      min: 0,
    },
    endPriceBDT: {
      type: Number,
      default: null,
    },
    closesAt: {
      type: Date,
      required: true,
    },
    result: {
      type: String,
      enum: ['pending', 'win', 'loss'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prediction history for a user, newest first
predictionChallengeSchema.index({ userId: 1, createdAt: -1 });

// Settlement job scans for due, unresolved predictions
predictionChallengeSchema.index({ result: 1, closesAt: 1 });

export const PredictionChallenge = model('PredictionChallenge', predictionChallengeSchema);
