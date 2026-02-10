import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as mediaRepo from '../repositories/media.js';
import { uploadFile, deleteFile } from '../config/s3.js';

/**
 * GET /api/admin/media - List media
 */
export const getMedia = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
  const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
  const search = req.query.search as string || undefined;

  const result = await mediaRepo.getMedia({
    page,
    pageSize,
    tags,
    search,
  });

  res.json({ success: true, ...result });
});

/**
 * POST /api/admin/media - Upload media and save to DB
 */
export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file provided' });
    return;
  }

  const { altText, tags } = req.body;
  const parsedTags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [];

  // Upload to S3
  const uploadResult = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    'library' // Use distinct folder for library uploads
  );

  // Save to DB
  const media = await mediaRepo.createMedia({
    filename: req.file.originalname,
    url: uploadResult.url,
    mimetype: req.file.mimetype,
    size: req.file.size,
    alt_text: altText,
    tags: parsedTags,
    uploaded_by: req.user!.id,
  });

  res.status(201).json({ success: true, data: media });
});

/**
 * PUT /api/admin/media/:id - Update media metadata
 */
export const updateMedia = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { altText, tags } = req.body;

  const media = await mediaRepo.updateMedia(id, {
    alt_text: altText,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : undefined,
  });

  res.json({ success: true, data: media });
});

/**
 * DELETE /api/admin/media/:id - Delete media
 */
export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get media to find key
  const media = await mediaRepo.getMediaById(id);
  if (!media) {
    res.status(404).json({ success: false, error: 'Media not found' });
    return;
  }

  // Extract key from URL
  // URL Format: https://bucket.s3.region.amazonaws.com/folder/filename
  try {
    const urlParts = new URL(media.url);
    const key = urlParts.pathname.substring(1); // Remove leading slash
    await deleteFile(key);
  } catch (e) {
    console.error('Failed to delete from S3, proceeding with DB delete', e);
  }

  await mediaRepo.deleteMedia(id);
  res.json({ success: true });
});
