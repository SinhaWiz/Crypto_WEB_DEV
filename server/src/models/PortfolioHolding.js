import mongoose from 'mongoose';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const { Schema, model } = mongoose;

const portfolioHoldingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      enum: SUPPORTED_SYMBOLS,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    averageBuyPriceBDT: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    realizedPnlBDT: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

portfolioHoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const PortfolioHolding = model('PortfolioHolding', portfolioHoldingSchema);
