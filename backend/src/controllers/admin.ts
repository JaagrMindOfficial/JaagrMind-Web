import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as postsRepo from '../repositories/posts.js';
import * as topicsRepo from '../repositories/topics.js';
import { usersRepository } from '../repositories/users.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/admin/posts - List author's posts (or all for editor+)
 */
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 50);
  const status = req.query.status as string || undefined;
  const sortBy = req.query.sortBy as 'created_at' | 'updated_at' | 'view_count' | 'clap_count' | undefined;
  const sortDir = req.query.sortDir as 'asc' | 'desc' | undefined;

  // Authors see only their own posts, editors+ see all
  const authorId = ['admin', 'editor'].includes(req.user!.role)
    ? undefined
    : req.user!.id;

  const result = await postsRepo.getPosts({
    page,
    pageSize,
    status,
    authorId,
    sortBy,
    sortDir,
  });

  res.json({ success: true, ...result });
});

/**
 * GET /api/admin/posts/:id - Get post by ID
 */
export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await postsRepo.getPostById(id);

  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }

  // Check ownership for authors
  if (req.user!.role === 'author' && post.author_id !== req.user!.id) {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  res.json({ success: true, data: post });
});

/**
 * POST /api/admin/posts - Create post
 */
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { title, subtitle, slug, content, coverUrl, topicIds, publicationId, status } = req.body;

  if (!title?.trim() || !slug?.trim()) {
    res.status(400).json({ success: false, error: 'Title and slug are required' });
    return;
  }

  const post = await postsRepo.createPost(req.user!.id, {
    title: title.trim(),
    subtitle: subtitle?.trim(),
    slug: `${slug.trim().toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}`,
    content: content || [],
    cover_url: coverUrl,
    status: status || 'draft',
    publication_id: publicationId,
    published_at: status === 'published' ? new Date().toISOString() : undefined,
  });

  if (topicIds?.length) {
    await postsRepo.setPostTopics(post.id, topicIds);
  }

  res.status(201).json({ success: true, data: post });
});

/**
 * PUT /api/admin/posts/:id - Update post
 */
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, subtitle, slug, content, coverUrl, topicIds, status, publicationId } = req.body;

  // Fetch existing post if we need to check status change or ownership
  let existing = null;
  if (req.user!.role === 'author' || (status === 'published')) {
      existing = await postsRepo.getPostById(id);
  }

  // Check ownership for authors
  if (req.user!.role === 'author') {
    if (!existing || existing.author_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }
  }



  const post = await postsRepo.updatePost(id, {
    title: title?.trim(),
    subtitle: subtitle?.trim(),
    slug: slug?.trim().toLowerCase().replace(/\s+/g, '-'),
    content,
    cover_url: coverUrl,
    status: req.user!.role === 'author' ? undefined : status, // Authors can't change status
    publication_id: publicationId,
    published_at: (status === 'published' && status !== existing?.status) ? new Date().toISOString() : undefined,
  });

  if (topicIds !== undefined) {
    await postsRepo.setPostTopics(id, topicIds || []);
  }

  res.json({ success: true, data: post });
});

/**
 * POST /api/admin/posts/:id/publish - Publish post (editor+)
 */
export const publishPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await postsRepo.publishPost(id);

  res.json({ success: true, data: post });
});

/**
 * DELETE /api/admin/posts/:id - Delete post (soft delete)
 */
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check ownership for authors
  if (req.user!.role === 'author') {
    const existing = await postsRepo.getPostById(id);
    if (!existing || existing.author_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }
  }

  await postsRepo.deletePost(id);
  res.json({ success: true });
});

/**
 * GET /api/admin/topics - List all topics
 */
export const getTopics = asyncHandler(async (_req: Request, res: Response) => {
  const topics = await topicsRepo.getTopics();
  res.json({ success: true, data: topics });
});

/**
 * POST /api/admin/topics - Create topic (editor+)
 */
export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, coverUrl } = req.body;

  if (!name?.trim() || !slug?.trim()) {
    res.status(400).json({ success: false, error: 'Name and slug are required' });
    return;
  }

  const topic = await topicsRepo.createTopic(
    name.trim(),
    slug.trim().toLowerCase().replace(/\s+/g, '-'),
    description?.trim(),
    coverUrl
  );

  res.status(201).json({ success: true, data: topic });
});

/**
 * PUT /api/admin/topics/:id - Update topic (editor+)
 */
export const updateTopic = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, description, coverUrl } = req.body;

  const topic = await topicsRepo.updateTopic(id, {
    name: name?.trim(),
    slug: slug?.trim().toLowerCase().replace(/\s+/g, '-'),
    description: description?.trim(),
    cover_url: coverUrl,
  });

  res.json({ success: true, data: topic });
});

/**
 * DELETE /api/admin/topics/:id - Delete topic (editor+)
 */
export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await topicsRepo.deleteTopic(id);
  res.json({ success: true });
});

// ==================== USER MANAGEMENT (admin only) ====================

/**
 * GET /api/admin/users - List all users
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const search = req.query.search as string || undefined;

  const users = await usersRepository.getAll(page, limit, search);
  res.json({ success: true, ...users });
});

/**
 * GET /api/admin/users/stats - Get user statistics
 */
export const getUserStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await usersRepository.getStats();
  res.json({ success: true, data: stats });
});

/**
 * GET /api/admin/users/:id/stats - Get specific user stats
 */
export const getUserStatsById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const stats = await usersRepository.getUserStats(id);
  res.json({ success: true, data: stats });
});

/**
 * GET /api/admin/users/:id - Get user by ID
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await usersRepository.getById(id);

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({ success: true, data: user });
});

/**
 * PUT /api/admin/users/:id/role - Update user role
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['admin', 'editor', 'author', 'reader'];
  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role' });
    return;
  }

  await usersRepository.updateRole(id, role);
  res.json({ success: true, message: 'Role updated' });
});

/**
 * DELETE /api/admin/users/:id - Delete user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Prevent self-deletion
  if (id === req.user!.id) {
    res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    return;
  }

  await usersRepository.delete(id);
  res.json({ success: true, message: 'User deleted' });
});

/**
 * PUT /api/admin/users/:id/permissions - Update user permissions
 */
export const updateUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { can_delete_own_comments, can_delete_others_comments } = req.body;

  await usersRepository.updatePermissions(id, {
    can_delete_own_comments,
    can_delete_others_comments,
  });

  res.json({ success: true, message: 'Permissions updated' });
});

/**
 * POST /api/admin/users/invite - Invite a new user with role
 */
export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, displayName, role, password } = req.body;

  if (!email || !username || !role) {
    res.status(400).json({ success: false, error: 'Email, username, and role are required' });
    return;
  }

  const validRoles = ['admin', 'editor', 'author', 'reader'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role' });
    return;
  }

  // Import supabaseAdmin dynamically to avoid circular deps
  const { supabaseAdmin } = await import('../config/supabase.js');

  // Check username availability
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingProfile) {
    res.status(400).json({ success: false, error: 'Username already taken' });
    return;
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: password || Math.random().toString(36).slice(-12), // Auto-generate if not provided
    email_confirm: true,
  });

  if (authError) {
    res.status(400).json({ success: false, error: authError.message });
    return;
  }

  // Create user in users table
  const { error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      role,
    });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    res.status(500).json({ success: false, error: 'Failed to create user' });
    return;
  }

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      user_id: authData.user.id,
      username,
      display_name: displayName || username,
    });

  if (profileError) {
    await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    res.status(500).json({ success: false, error: 'Failed to create profile' });
    return;
  }

  res.status(201).json({ 
    success: true, 
    message: 'User created successfully',
    data: { id: authData.user.id, email, username, role }
  });
});
