import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/error.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/signup - Register with email
 */
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, username, displayName } = req.body;

  if (!email || !password || !username) {
    res.status(400).json({ 
      success: false, 
      error: 'Email, password, and username are required' 
    });
    return;
  }

  // Check if username is taken
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingProfile) {
    res.status(400).json({ success: false, error: 'Username already taken' });
    return;
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for development (set to false in production)
  });

  if (authError) {
    res.status(400).json({ success: false, error: authError.message });
    return;
  }

  // Create user in our users table
  const { error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      role: 'reader',
    });

  if (userError) {
    // Rollback auth user
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
    // Cleanup
    await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    res.status(500).json({ success: false, error: 'Failed to create profile' });
    return;
  }

  res.status(201).json({ 
    success: true, 
    message: 'Account created. Please check your email for verification.' 
  });
}));

/**
 * POST /api/auth/login - Login with email
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  // Get user with profile
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*, profiles(*)')
    .eq('id', data.user.id)
    .single();

  res.json({
    success: true,
    data: {
      user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  });
}));

/**
 * POST /api/auth/logout - Logout
 */
router.post('/logout', authenticate, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  await supabaseAdmin.auth.signOut();
  res.json({ success: true });
}));

/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ success: true, data: null });
    return;
  }

  // Get user with profile
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*, profiles(*)')
    .eq('id', req.user.id)
    .single();

  res.json({ success: true, data: user });
}));

/**
 * POST /api/auth/refresh - Refresh access token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ success: false, error: 'Refresh token required' });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
    return;
  }

  res.json({
    success: true,
    data: {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    },
  });
}));

export default router;
