// ... (no change needed if error handler logs)
// Wait, user provided logs but they were frontend logs.
// The backend logs should have appeared in the terminal if `NODE_ENV=development`.
// Let's explicitly log the error in `getSavedPosts` controller.

import { asyncHandler } from '../middleware/error.js';
import { libraryRepository } from '../repositories/library.js';

export const savePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id; // Auth middleware ensures this
  const { postId } = req.body;

  if (!postId) {
    res.status(400);
    throw new Error('Post ID is required');
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
    res.json(result);
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
  res.json({ saved });
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
  res.json(result);
});

export const getResponses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await libraryRepository.getUserResponses(userId, page, limit);
  res.json(result);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const stats = await libraryRepository.getLibraryStats(userId);
  res.json(stats);
});
