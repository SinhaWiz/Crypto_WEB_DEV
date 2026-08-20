import mongoose from 'mongoose';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const { Schema, model } = mongoose;

const transactionSchema = new Schema(
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
      enum: ['buy', 'sell'],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    executionPriceBDT: {
      type: Number,
      required: true,
      min: 0,
    },
    feeBDT: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    marketType: {
      type: String,
      required: true,
      enum: ['spot', 'position'],
      default: 'spot',
    },
    positionSide: {
      type: String,
      enum: ['long', 'short'],
      default: null,
    },
    positionAction: {
      type: String,
      enum: ['open', 'close'],
      default: null,
    },
    leverage: {
      type: Number,
      default: null,
      min: 1,
      max: 10,
    },
    marginBDT: {
      type: Number,
      default: null,
      min: 0,
    },
    pnlBDT: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Paginated transaction history, newest first
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = model('Transaction', transactionSchema);
