import mongoose from 'mongoose';
import { MAX_LEVERAGE, MIN_LEVERAGE, POSITION_SIDES, SUPPORTED_SYMBOLS } from '../constants/index.js';

const { Schema, model } = mongoose;

const leveragedPositionSchema = new Schema(
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
    side: {
      type: String,
      required: true,
      enum: POSITION_SIDES,
    },
    leverage: {
      type: Number,
      required: true,
      min: MIN_LEVERAGE,
      max: MAX_LEVERAGE,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    entryPriceBDT: {
      type: Number,
      required: true,
      min: 0,
    },
    marginBDT: {
      type: Number,
      required: true,
      min: 0,
    },
    realizedPnlBDT: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['open', 'closed'],
      default: 'open',
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

leveragedPositionSchema.index(
  { userId: 1, symbol: 1, side: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'open' },
  }
);

export const LeveragedPosition = model('LeveragedPosition', leveragedPositionSchema);
