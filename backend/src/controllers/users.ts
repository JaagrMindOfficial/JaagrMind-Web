import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { usersRepository } from '../repositories/users.js';

/**
 * GET /api/users/who-to-follow - Get suggested users
 */
export const getWhoToFollow = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 3, 10);
  // @ts-ignore - User might be null if not authenticated, which is handled in repo
  const userId = req.user?.id || null;
  
  const users = await usersRepository.getWhoToFollow(userId, limit);
  res.json({ success: true, data: users });
});

/**
 * GET /api/users/following - Get users followed by current user
 */
export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const userId = req.user!.id; // Auth required middleware should ensure this

  const result = await usersRepository.getFollowing(userId, page, limit);
  res.json({ success: true, ...result });
});
