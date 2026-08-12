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
    // We can store a single daily snapshot for simplicity or hourly. Let's just use a timestamp for the data point.
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    volume24h: {
      type: Number,
      default: 0,
    },
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
priceHistorySchema.index({ symbol: 1, timestamp: -1 });

export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
