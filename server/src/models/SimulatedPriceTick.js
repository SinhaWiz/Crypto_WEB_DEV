import mongoose from 'mongoose';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const simulatedPriceTickSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SimulationSession',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      enum: SUPPORTED_SYMBOLS,
    },
    priceBDT: {
      type: Number,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for querying specific ticks for a session efficiently
simulatedPriceTickSchema.index({ sessionId: 1, symbol: 1, generatedAt: -1 });

export const SimulatedPriceTick = mongoose.model('SimulatedPriceTick', simulatedPriceTickSchema);
