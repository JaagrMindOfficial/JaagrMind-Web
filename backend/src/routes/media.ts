import { Router } from 'express';
import multer from 'multer';
import * as mediaController from '../controllers/media.js';
import { authenticate, requireAuth, requireMinRole } from '../middleware/auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All media routes require authentication and at least 'author' role
router.use(authenticate);
router.use(requireAuth);
router.use(requireMinRole('author'));

router.get('/', mediaController.getMedia);
router.post('/', upload.single('file'), mediaController.uploadMedia);
router.put('/:id', mediaController.updateMedia);
router.delete('/:id', mediaController.deleteMedia);

export default router;
