import mongoose from 'mongoose';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const priceHistorySchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      enum: SUPPORTED_SYMBOLS,
      index: true,
    },
    provider: {
      type: String,
      required: true,
    },
    interval: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    open: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      required: true,
    },
    // Adding these to keep frontend functional
    marketCap: {
      type: Number,
      default: 0,
    },
    percentChange24h: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

// Compound index for efficient querying of a coin's history
priceHistorySchema.index({ symbol: 1, interval: 1, timestamp: -1 });

export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
