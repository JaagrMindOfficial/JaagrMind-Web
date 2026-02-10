import { Router, Request, Response } from 'express';
import { profilesRepository } from '../repositories/profiles.js';
import * as postsRepo from '../repositories/posts.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

// Get current user's profile
router.get('/me', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await profilesRepository.getByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const stats = await profilesRepository.getStats(userId);
    
    res.json({ 
      data: { ...profile, stats } 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update current user's profile
router.put('/me', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { display_name, bio, avatar_url, website, social_links } = req.body;

    const profile = await profilesRepository.update(userId, {
      display_name,
      bio,
      avatar_url,
      website,
      social_links,
    });

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get profile by username
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const profile = await profilesRepository.getByUsername(username);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const stats = await profilesRepository.getStats(profile.user_id);

    res.json({ 
      data: { ...profile, stats } 
    });
  } catch (error) {
    console.error('Get profile by username error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Get user's posts
router.get('/:username/posts', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || 10;

    const profile = await profilesRepository.getByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const posts = await postsRepo.getPosts({
      page,
      pageSize,
      authorId: profile.user_id,
    });

    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to get posts' });
  }
});

// Get followers
router.get('/:username/followers', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const profile = await profilesRepository.getByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const followers = await profilesRepository.getFollowers(profile.user_id, page, limit);
    res.json(followers);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Failed to get followers' });
  }
});

// Get following
router.get('/:username/following', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const profile = await profilesRepository.getByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const following = await profilesRepository.getFollowing(profile.user_id, page, limit);
    res.json(following);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Failed to get following' });
  }
});

// Follow user
router.post('/:username/follow', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const followerId = req.user!.id;

    const profile = await profilesRepository.getByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (profile.user_id === followerId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    await profilesRepository.follow(followerId, profile.user_id);
    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Failed to follow user' });
  }
});

// Unfollow user
router.delete('/:username/follow', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const followerId = req.user!.id;

    const profile = await profilesRepository.getByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await profilesRepository.unfollow(followerId, profile.user_id);
    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ message: 'Failed to unfollow user' });
  }
});

// Check if following
router.get('/:username/following-status', authenticate, requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const followerId = req.user!.id;

    const profile = await profilesRepository.getByUsername(username);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const isFollowing = await profilesRepository.isFollowing(followerId, profile.user_id);
    res.json({ isFollowing });
  } catch (error) {
    console.error('Check following status error:', error);
    res.status(500).json({ message: 'Failed to check following status' });
  }
});

export default router;
