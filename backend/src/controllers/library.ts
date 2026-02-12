// ... (no change needed if error handler logs)
// Wait, user provided logs but they were frontend logs.
// The backend logs should have appeared in the terminal if `NODE_ENV=development`.
// Let's explicitly log the error in `getSavedPosts` controller.

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { libraryRepository } from '../repositories/library.js';

import { ApiError } from '../middleware/error.js';

export const savePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id; 
  const { postId } = req.body;

  console.log(`[Library] savePost called by ${userId}. Body:`, req.body);

  if (!postId) {
    throw new ApiError('Post ID is required', 400);
  }

  await libraryRepository.savePost(userId, postId);
  res.status(200).json({ success: true, saved: true });
});

export const unsavePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params; // post ID

  await libraryRepository.unsavePost(userId, id);
  res.status(200).json({ success: true, saved: false });
});

export const getSavedPosts = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`[Library] Fetching saved posts for user ${userId}, page ${page}`);
    const result = await libraryRepository.getSavedPosts(userId, page, limit);
    
    res.json({
        success: true,
        data: result.data,
        meta: {
            page,
            pageSize: limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
        }
    });
  } catch (error) {
    console.error('[Library] Error in getSavedPosts:', error);
    throw error;
  }
});

export const checkSavedStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.json({ saved: false });
    return;
  }

  const saved = await libraryRepository.checkIsSaved(userId, id);
  res.json({ success: true, data: { saved } });
});

export const trackRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params; // Post ID

  if (userId) {
    await libraryRepository.addToHistory(userId, id);
  }
  
  // Even if not logged in, we assume success for the frontend tracking call
  res.status(200).json({ success: true });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await libraryRepository.getHistory(userId, page, limit);
  // Transform to PaginatedResponse format
  res.json({
      success: true,
      data: result.data,
      meta: {
          page,
          pageSize: limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
      }
  });
});

export const getResponses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await libraryRepository.getUserResponses(userId, page, limit);
  res.json({
      success: true,
      data: result.data,
      meta: {
          page,
          pageSize: limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
      }
  });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  console.log(`[Library] getStats called for user: ${userId}`);
  
  const stats = await libraryRepository.getLibraryStats(userId);
  console.log(`[Library] getStats result for ${userId}:`, stats);
  
  res.json({ success: true, data: stats });
});
