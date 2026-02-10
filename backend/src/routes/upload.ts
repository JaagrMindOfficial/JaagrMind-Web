import { Router, Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/error.js';
import { authenticate, requireAuth, requireMinRole } from '../middleware/auth.js';
import { uploadFile, getUploadUrl, deleteFile } from '../config/s3.js';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All upload routes require authentication
router.use(authenticate);
router.use(requireAuth);
router.use(requireMinRole('author'));

/**
 * POST /api/upload - Upload file to S3
 */
router.post('/', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file provided' });
    return;
  }

  const folder = req.body.folder || 'uploads';
  const result = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder
  );

  res.json({ success: true, data: result });
}));

/**
 * POST /api/upload/presigned - Get presigned URL for direct upload
 */
router.post('/presigned', asyncHandler(async (req: Request, res: Response) => {
  const { filename, contentType, folder } = req.body;

  if (!filename || !contentType) {
    res.status(400).json({ success: false, error: 'Filename and contentType are required' });
    return;
  }

  const result = await getUploadUrl(filename, contentType, folder);

  res.json({ success: true, data: result });
}));

/**
 * DELETE /api/upload - Delete file from S3
 */
router.delete('/', asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.body;

  if (!key) {
    res.status(400).json({ success: false, error: 'Key is required' });
    return;
  }

  await deleteFile(key);

  res.json({ success: true });
}));

export default router;
