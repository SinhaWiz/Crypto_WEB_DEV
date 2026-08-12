import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const forumPostSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: [5, 'Post title must be at least 5 characters long'],
      maxlength: [100, 'Post title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [10, 'Post content must be at least 10 characters long'],
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
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
