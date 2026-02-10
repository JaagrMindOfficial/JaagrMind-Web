import { Router } from 'express';
import { authenticate, requireAuth, requireMinRole } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.js';

const router = Router();

// All admin routes require authentication
router.use(authenticate);
router.use(requireAuth);

// Posts (author+)
router.get('/posts', requireMinRole('author'), adminController.getPosts);
router.post('/posts', requireMinRole('author'), adminController.createPost);
router.get('/posts/:id', requireMinRole('author'), adminController.getPost);
router.put('/posts/:id', requireMinRole('author'), adminController.updatePost);
router.delete('/posts/:id', requireMinRole('author'), adminController.deletePost);
router.post('/posts/:id/publish', requireMinRole('editor'), adminController.publishPost);

// Topics (editor+)
router.get('/topics', requireMinRole('author'), adminController.getTopics);
router.post('/topics', requireMinRole('editor'), adminController.createTopic);
router.put('/topics/:id', requireMinRole('editor'), adminController.updateTopic);
router.delete('/topics/:id', requireMinRole('editor'), adminController.deleteTopic);

// Users (admin only)
router.get('/users', requireMinRole('admin'), adminController.getUsers);
router.get('/users/stats', requireMinRole('admin'), adminController.getUserStats);
router.get('/users/:id/stats', requireMinRole('admin'), adminController.getUserStatsById);
router.post('/users/invite', requireMinRole('admin'), adminController.inviteUser);
router.get('/users/:id', requireMinRole('admin'), adminController.getUser);
router.put('/users/:id/role', requireMinRole('admin'), adminController.updateUserRole);
router.put('/users/:id/permissions', requireMinRole('admin'), adminController.updateUserPermissions);
router.delete('/users/:id', requireMinRole('admin'), adminController.deleteUser);

export default router;
