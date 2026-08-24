import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const marketEventLogSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'SimulationSession',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    symbols: {
      type: [String],
      required: true,
    },
    impactPercent: {
      type: Number,
      required: true,
    },
    costPoints: {
      type: Number,
      required: true,
      default: 0,
    },
    source: {
      type: String,
      enum: ['user', 'ambient'],
      required: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Serves both the cooldown check (findOne sorted desc) and the recent-events feed
marketEventLogSchema.index({ userId: 1, triggeredAt: -1 });

export const MarketEventLog = model('MarketEventLog', marketEventLogSchema);
