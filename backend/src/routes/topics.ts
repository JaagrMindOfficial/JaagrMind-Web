import { Router } from 'express';
import * as topicsController from '../controllers/topics.js';

const router = Router();

// Public routes
router.get('/', topicsController.getTopics);
router.get('/:slug', topicsController.getTopic);

export default router;
