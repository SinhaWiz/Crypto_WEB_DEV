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
  },
  { timestamps: true }
);

// Paginated transaction history, newest first
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = model('Transaction', transactionSchema);
