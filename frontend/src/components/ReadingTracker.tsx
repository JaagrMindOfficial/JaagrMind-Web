'use client';

import { useAuth } from '@/contexts/AuthContext';
import { trackRead } from '@/lib/api';
import { useEffect } from 'react';

export function ReadingTracker({ postId }: { postId: string }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Determine if we should track
    // If we want to track anonymous views too, we can remove the isAuthenticated check
    // The backend `trackRead` handles optional auth (only records history if logged in)
    // But for view counts, we might want to call it anyway.
    // The requirement is "implement reading history end to end".
    // History is user-specific.
    if (postId) {
       // We call it always. Backend logic: if user -> add to history.
       // (And ideally increment view count, but generic view count might be separate).
       // The user prompt only asked for "reading history".
       // The `trackRead` endpoint implementation calls `addToHistory` IF user exists.
       trackRead(postId).catch(err => console.error('Failed to track read:', err));
    }
  }, [postId]);

  return null;
}
