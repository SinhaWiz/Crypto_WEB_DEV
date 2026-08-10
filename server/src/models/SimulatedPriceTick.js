import mongoose from 'mongoose';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const { Schema, model } = mongoose;

const simulatedPriceTickSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'SimulationSession',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      enum: SUPPORTED_SYMBOLS,
    },
    priceBDT: {
      type: Number,
      required: true,
      min: 0,
    },
    sourceWindow: {
      type: String,
      default: 'latest',
    },
    seed: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

simulatedPriceTickSchema.index({ sessionId: 1, symbol: 1, generatedAt: -1 });

export const SimulatedPriceTick = model('SimulatedPriceTick', simulatedPriceTickSchema);
