import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import * as postsController from '../controllers/posts.js';
import * as statsController from '../controllers/stats.js';

const router = Router();

// All routes use authentication (but most are public)
router.use(authenticate);

// Public routes
router.get('/', postsController.getPosts);
router.get('/:slug', postsController.getPost);
router.get('/@:username/:slug', postsController.getPostByAuthor);
router.post('/:id/claps', postsController.addClaps);
router.get('/:id/comments', postsController.getComments);

// Auth required
router.get('/:id/stats', requireAuth, statsController.getPostStats);
router.post('/:id/comments', requireAuth, postsController.addComment);
router.delete('/:id/comments/:commentId', requireAuth, postsController.deleteComment);

export default router;
