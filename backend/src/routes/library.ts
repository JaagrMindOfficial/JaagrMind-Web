import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import * as libraryController from '../controllers/library.js';

const router = Router();

// Saved Posts (Reading List)
router.post('/saved', authenticate, requireAuth, libraryController.savePost);
router.delete('/saved/:id', authenticate, requireAuth, libraryController.unsavePost);
router.get('/saved', authenticate, requireAuth, libraryController.getSavedPosts);
router.get('/saved/:id/status', authenticate, libraryController.checkSavedStatus);

// History
router.post('/history/:id', authenticate, libraryController.trackRead); // :id is post id
router.get('/history', authenticate, requireAuth, libraryController.getHistory);

// Responses
router.get('/responses', authenticate, requireAuth, libraryController.getResponses);

// Stats
router.get('/stats', authenticate, requireAuth, libraryController.getStats);

export default router;
