import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const forumVoteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required to cast a vote'],
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: [true, 'Post ID is required to cast a vote'],
      index: true,
    },
    voteType: {
      type: String,
      enum: {
        values: ['UP', 'DOWN'],
        message: 'Vote type must be either UP or DOWN',
      },
      required: [true, 'Vote type is required'],
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can only vote on a post once
forumVoteSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const ForumVote = model('ForumVote', forumVoteSchema);
