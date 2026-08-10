import mongoose from 'mongoose';
import { STARTING_BALANCE_BDT } from '../constants/index.js';

const { Schema, model } = mongoose;

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    cashBalanceBDT: {
      type: Number,
      required: true,
      default: STARTING_BALANCE_BDT,
      min: 0,
    },
    virtualPoints: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },
    portfolioValueBDT: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const Wallet = model('Wallet', walletSchema);
