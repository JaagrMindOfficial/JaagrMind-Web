import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as statsRepo from '../repositories/stats.js';

/**
 * GET /api/posts/:id/stats - Get post statistics (Author only)
 */
export const getPostStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const stats = await statsRepo.getPostStats(id, req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
         res.status(403).json({ success: false, error: 'Unauthorized' });
    } else {
        throw error;
    }
  }
});
