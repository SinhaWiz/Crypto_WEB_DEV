import mongoose from 'mongoose';
import { ForumPost } from '../models/ForumPost.js';
import { ForumComment } from '../models/ForumComment.js';
import { ForumVote } from '../models/ForumVote.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';

export async function getPosts(req, res) {
  const { sort = 'recent', page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const sortOptions = sort === 'top' ? { score: -1, createdAt: -1 } : { createdAt: -1 };

  const posts = await ForumPost.find()
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .populate('author', 'name')
    .lean();
  
  const total = await ForumPost.countDocuments();

  res.json({ posts, total, page: Number(page), limit: Number(limit) });
}

export async function getPostById(req, res) {
  const { id } = req.params;

  const post = await ForumPost.findById(id).populate('author', 'name').lean();

  if (!post) {
    throw new AppError('Post not found', 404, ERROR_CODES.NOT_FOUND);
  }

  res.json({ post });
}

export async function createPost(req, res) {
  const { title, content } = req.body;
  const userId = req.user.id;

  // Rate limiting check: max 2 posts per 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentPostCount = await ForumPost.countDocuments({
    author: userId,
    createdAt: { $gte: twentyFourHoursAgo }
  });

  if (recentPostCount >= 2) {
    throw new AppError('You can only create 2 posts per 24 hours. Please wait before posting again.', 429, ERROR_CODES.VALIDATION_ERROR);
  }

  const post = await ForumPost.create({
    title,
    content,
    author: userId
  });

  // Populate author before returning
  await post.populate('author', 'name');

  res.status(201).json({ post });
}

export async function getComments(req, res) {
  const { id } = req.params;

  const postExists = await ForumPost.exists({ _id: id });
  if (!postExists) {
    throw new AppError('Post not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const comments = await ForumComment.find({ postId: id })
    .sort({ createdAt: 1 })
    .populate('author', 'name')
    .lean();

  res.json({ comments });
}

export async function addComment(req, res) {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const postExists = await ForumPost.exists({ _id: id });
  if (!postExists) {
    throw new AppError('Post not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const comment = await ForumComment.create({
    postId: id,
    author: userId,
    content
  });

  await comment.populate('author', 'name');

  res.status(201).json({ comment });
}

export async function votePost(req, res) {
  const { id: postId } = req.params;
  const { action } = req.body; // 'UP', 'DOWN', or 'REMOVE'
  const userId = req.user.id;

  if (!['UP', 'DOWN', 'REMOVE'].includes(action)) {
    throw new AppError('Invalid action', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const post = await ForumPost.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const existingVote = await ForumVote.findOne({ userId, postId });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let upvoteChange = 0;
    let downvoteChange = 0;

    if (action === 'REMOVE') {
      if (existingVote) {
        if (existingVote.voteType === 'UP') upvoteChange = -1;
        if (existingVote.voteType === 'DOWN') downvoteChange = -1;
        await ForumVote.deleteOne({ _id: existingVote._id }, { session });
      }
    } else {
      if (existingVote) {
        if (existingVote.voteType !== action) {
          if (action === 'UP') {
            upvoteChange = 1;
            downvoteChange = -1;
          } else {
            upvoteChange = -1;
            downvoteChange = 1;
          }
          existingVote.voteType = action;
          await existingVote.save({ session });
        }
      } else {
        if (action === 'UP') upvoteChange = 1;
        if (action === 'DOWN') downvoteChange = 1;
        
        await ForumVote.create([{ userId, postId, voteType: action }], { session });
      }
    }

    if (upvoteChange !== 0 || downvoteChange !== 0) {
      const updatedPost = await ForumPost.findByIdAndUpdate(
        postId,
        {
          $inc: {
            upvotes: upvoteChange,
            downvotes: downvoteChange,
            score: upvoteChange - downvoteChange
          }
        },
        { new: true, session }
      );
      
      await session.commitTransaction();
      res.json({ score: updatedPost.score, upvotes: updatedPost.upvotes, downvotes: updatedPost.downvotes });
    } else {
      await session.commitTransaction();
      res.json({ score: post.score, upvotes: post.upvotes, downvotes: post.downvotes });
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
