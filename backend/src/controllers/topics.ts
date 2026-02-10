import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as topicsRepo from '../repositories/topics.js';

/**
 * GET /api/topics - List all topics (public)
 */
export const getTopics = asyncHandler(async (_req: Request, res: Response) => {
  const topics = await topicsRepo.getTopics();
  res.json({ success: true, data: topics });
});

/**
 * GET /api/topics/:slug - Get topic by slug
 */
export const getTopic = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const topic = await topicsRepo.getTopicBySlug(slug);

  if (!topic) {
    res.status(404).json({ success: false, error: 'Topic not found' });
    return;
  }

  res.json({ success: true, data: topic });
});
