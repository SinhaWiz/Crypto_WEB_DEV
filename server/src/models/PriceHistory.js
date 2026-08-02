import mongoose from 'mongoose';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const { Schema, model } = mongoose;

const priceHistorySchema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      enum: SUPPORTED_SYMBOLS,
    },
    provider: {
      type: String,
      required: true,
    },
    interval: {
      type: String,
      required: true,
      enum: ['5m', '1h', '1d'],
    },
    timestamp: {
      type: Date,
      required: true,
    },
    open: {
      type: Number,
      required: true,
      min: 0,
    },
    high: {
      type: Number,
      required: true,
      min: 0,
    },
    low: {
      type: Number,
      required: true,
      min: 0,
    },
    close: {
      type: Number,
      required: true,
      min: 0,
    },
    volume: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

priceHistorySchema.index({ symbol: 1, interval: 1, timestamp: 1 }, { unique: true });

export const PriceHistory = model('PriceHistory', priceHistorySchema);
