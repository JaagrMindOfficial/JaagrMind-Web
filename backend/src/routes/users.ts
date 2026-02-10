import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as usersController from '../controllers/users.js';

const router = Router();

// All routes use authentication (optional for who-to-follow, required for following)
router.use(authenticate);

// Suggested users to follow
router.get('/who-to-follow', usersController.getWhoToFollow);

// Users followed by current user
router.get('/following', usersController.getFollowing);
router.get('/me/following/ids', usersController.getMyFollowingIds);

// Follow/Unfollow
router.post('/:id/follow', usersController.followUser);
router.delete('/:id/follow', usersController.unfollowUser);

export default router;
