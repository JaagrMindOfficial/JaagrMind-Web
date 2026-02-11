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

/**
 * GET /api/users/me/following/ids - Get all following IDs for current user
 */
export const getMyFollowingIds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ success: true, data: [] });
    return;
  }
  const ids = await usersRepository.getAllFollowingIds(req.user.id);
  res.json({ success: true, data: ids });
});

/**
 * POST /api/users/:id/follow - Follow a user
 */
export const followUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const followerId = req.user.id;
  const targetId = req.params.id;

  await usersRepository.followUser(followerId, targetId);
  res.json({ success: true });
});

/**
 * DELETE /api/users/:id/follow - Unfollow a user
 */
export const unfollowUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const followerId = req.user.id;
  const targetId = req.params.id;

  await usersRepository.unfollowUser(followerId, targetId);
  res.json({ success: true });
});

/**
 * GET /api/users/:username - Get user profile by username
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const username = req.params.username.replace('@', ''); // Handle /@username format
  const user = await usersRepository.getUserByUsername(username);
  
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  
  // Get follower count
  const followerCount = await usersRepository.getFollowerCount(user.id);

  // Clean up sensitive data before sending
  const { email, ...publicProfile } = user;
  
  // Return combined data
  // casting to any to attach extra property without changing User interface globally for now
  res.json({ success: true, data: { ...publicProfile, follower_count: followerCount } });
});
