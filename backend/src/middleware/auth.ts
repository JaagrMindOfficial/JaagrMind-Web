import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import type { User } from '../types/index.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
    }
  }
}

/**
 * Authenticate user from Supabase JWT token
 * Sets req.user if valid, otherwise continues without user (for public routes)
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next(); // No token, continue as anonymous
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !authUser) {
      return next(); // Invalid token, continue as anonymous
    }

    // Get user from our users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return next(); // User not in our DB, continue as anonymous
    }

    req.user = user as User;
    req.accessToken = token;
    next();
  } catch {
    next(); // Error, continue as anonymous
  }
}

/**
 * Require authenticated user
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  next();
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Role hierarchy check
 * admin > editor > author > reader
 */
const roleHierarchy: Record<string, number> = {
  admin: 4,
  editor: 3,
  author: 2,
  reader: 1,
};

export function requireMinRole(minRole: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 0;

    if (userLevel < requiredLevel) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
