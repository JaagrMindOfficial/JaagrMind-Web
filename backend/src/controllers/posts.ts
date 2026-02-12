import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as postsRepo from '../repositories/posts.js';
import * as engagementRepo from '../repositories/engagement.js';

import { usersRepository } from '../repositories/users.js';

/**
 * GET /api/posts - List published posts
 */
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50);
  const topicId = req.query.topicId as string | undefined;
  const topicSlug = req.query.topicSlug as string | undefined;

  const result = await postsRepo.getPosts({
    page,
    pageSize,
    status: 'published',
    topicId,
    topicSlug,
    viewerId: req.user?.id
  });

  // Inject is_following status if user is authenticated
  if (req.user) {
    const posts = result.data;
    const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter((id): id is string => !!id)));
    
    // Batch fetch followed status
    const followedIds = await usersRepository.getFollowedUserIds(req.user.id, authorIds);

    posts.forEach(post => {
      if (post.author && post.author_id && post.author_id !== req.user!.id) {
         // @ts-ignore
         post.author.is_following = followedIds.has(post.author_id);
      }
    });
  }

  res.json({ success: true, ...result });
});

/**
 * GET /api/posts/staff-picks - Get staff picks
 */
export const getStaffPicks = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 3, 10);
  const posts = await postsRepo.getStaffPicks(limit, req.user?.id);

  // Inject is_following status if user is authenticated
  if (req.user) {
    const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter((id): id is string => !!id)));
    
    // Batch fetch followed status
    const followedIds = await usersRepository.getFollowedUserIds(req.user.id, authorIds);

    posts.forEach(post => {
       if (post.author && post.author_id && post.author_id !== req.user!.id) {
         // @ts-ignore
         post.author.is_following = followedIds.has(post.author_id);
       }
    });
  }

  res.json({ success: true, data: posts });
});

/**
 * GET /api/posts/:slug - Get single post
 */


// ...

/**
 * GET /api/posts/:slug - Get single post
 */
export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const post = await postsRepo.getPostBySlug(slug, req.user?.id);

  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }

  // Check if current user is following the author
  if (req.user && post.author_id && req.user.id !== post.author_id) {
    const isFollowing = await usersRepository.isFollowing(req.user.id, post.author_id);
    if (post.author) {
      // @ts-ignore
      post.author.is_following = isFollowing;
    }
  }

  // Record view
  const ipAddress = req.ip || null;
  const userAgent = req.headers['user-agent'] || null;
  engagementRepo.recordView(post.id, req.user?.id || null, ipAddress, userAgent);

  res.json({ success: true, data: post });
});

/**
 * GET /api/posts/@:username/:slug - Get single post by author and slug
 */
export const getPostByAuthor = asyncHandler(async (req: Request, res: Response) => {
  const { username, slug } = req.params;
  const post = await postsRepo.getPostByUsernameAndSlug(username, slug, req.user?.id);

  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }

  // Check if current user is following the author
  if (req.user && post.author_id && req.user.id !== post.author_id) {
     const isFollowing = await usersRepository.isFollowing(req.user.id, post.author_id);
     if (post.author) {
       // @ts-ignore
       post.author.is_following = isFollowing;
     }
  }

  // Record view
  const ipAddress = req.ip || null;
  const userAgent = req.headers['user-agent'] || null;
  engagementRepo.recordView(post.id, req.user?.id || null, ipAddress, userAgent);

  res.json({ success: true, data: post });
});

/**
 * POST /api/posts/:id/claps - Add claps
 */
export const addClaps = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { count = 1, sessionId } = req.body;

  console.log(`[Posts] addClaps for post ${id}, count: ${count}, user: ${req.user?.id}, session: ${sessionId}`);

  const clap = await engagementRepo.addClap(
    id,
    req.user?.id || null,
    !req.user ? sessionId : null,
    Math.min(count, 10) // Max 10 claps per request
  );

  const totalClaps = await engagementRepo.getPostClaps(id);
  console.log(`[Posts] addClaps success. New total: ${totalClaps}`);

  res.json({ success: true, data: { clap, totalClaps } });
});

/**
 * GET /api/posts/:id/comments - Get comments
 */
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = await engagementRepo.getPostComments(id);

  res.json({ success: true, data: comments });
});

/**
 * POST /api/posts/:id/comments - Add comment (auth required)
 */
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, parentId } = req.body;

  if (!content?.trim()) {
    res.status(400).json({ success: false, error: 'Content is required' });
    return;
  }

  const comment = await engagementRepo.createComment(
    id,
    req.user!.id,
    content.trim(),
    parentId
  );

  res.status(201).json({ success: true, data: comment });
});

/**
 * DELETE /api/posts/:id/comments/:commentId - Delete comment
 */
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  const comment = await engagementRepo.getCommentById(commentId);
  if (!comment) {
    res.status(404).json({ success: false, error: 'Comment not found' });
    return;
  }

  // Allow deletion by comment author OR post author
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isPostAuthor = (comment as any).post?.author_id === req.user!.id;
  const isCommentAuthor = comment.user_id === req.user!.id;

  // Default permissions if not set (e.g. for readers)
  const canDeleteOwn = req.user!.can_delete_own_comments !== false; // Default TRUE
  const canDeleteOthers = req.user!.can_delete_others_comments === true; // Default FALSE

  if (isCommentAuthor) {
    if (!canDeleteOwn) {
      res.status(403).json({ success: false, error: 'Permission denied: Cannot delete own comments' });
      return;
    }
  } else if (isPostAuthor) {
    if (!canDeleteOthers) {
      res.status(403).json({ success: false, error: 'Permission denied: Cannot delete others comments' });
      return;
    }
  } else {
    res.status(403).json({ success: false, error: 'Unauthorized' });
    return;
  }

  await engagementRepo.deleteComment(commentId);

  res.json({ success: true });
});

/**
 * POST /api/posts/:id/time - Track reading time
 */
export const trackTime = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sessionId, duration } = req.body;

  if (!duration || typeof duration !== 'number') {
    res.status(400).json({ success: false, error: 'Duration is required' });
    return;
  }

  // Max 60 seconds per request to prevent abuse/errors
  const safeDuration = Math.min(Math.max(0, duration), 60);

  await engagementRepo.trackReadingTime(
    id,
    req.user?.id || null, // Can be null
    sessionId || null,
    safeDuration
  );

  res.json({ success: true });
});
