import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const forumVoteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
      index: true,
    },
    voteType: {
      type: String,
      enum: ['UP', 'DOWN'],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can only vote on a post once
forumVoteSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const ForumVote = model('ForumVote', forumVoteSchema);
