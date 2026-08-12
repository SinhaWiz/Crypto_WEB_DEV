import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const forumCommentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

export const ForumComment = model('ForumComment', forumCommentSchema);
