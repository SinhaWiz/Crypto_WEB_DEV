import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPosts, getPostById, createPost, getComments, addComment, votePost } from '../controllers/forumController.js';

const router = Router();

// All forum routes require authentication
router.use(requireAuth);

router.get('/posts', asyncHandler(getPosts));
router.get('/posts/:id', asyncHandler(getPostById));
router.post('/posts', asyncHandler(createPost));

router.get('/posts/:id/comments', asyncHandler(getComments));
router.post('/posts/:id/comments', asyncHandler(addComment));

router.post('/posts/:id/vote', asyncHandler(votePost));

export default router;
