import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const forumPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0, // upvotes - downvotes for sorting
    },
  },
  { timestamps: true }
);

export const ForumPost = model('ForumPost', forumPostSchema);
