import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const forumCommentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: [true, 'A comment must belong to a post'],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

export const ForumComment = model('ForumComment', forumCommentSchema);
