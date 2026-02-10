'use client';

import { useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';

interface ReadingTrackerProps {
  postId: string;
}

export function ReadingTracker({ postId }: ReadingTrackerProps) {
  const timeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');

  // Generate session ID on mount
  useEffect(() => {
    let sid = localStorage.getItem('jam_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('jam_session_id', sid);
    }
    sessionIdRef.current = sid;
  }, []);

  // Sync to backend
  const syncTime = async () => {
    const duration = timeRef.current;
    if (duration <= 0) return;

    try {
      await apiFetch(`/posts/${postId}/time`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          duration: duration,
        }),
      });
      // Reset local counter on success, but keep accumulating total potentially if we wanted to log locally
      timeRef.current = 0; 
    } catch (err) {
      console.error('Failed to sync reading time', err);
    }
  };

  useEffect(() => {
    // Only track when tab is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden -> pause and sync
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        syncTime();
      } else {
        // Tab visible -> resume
        startTimer();
      }
    };

    const startTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            timeRef.current += 1; // Increment by 1 second
            
            // Sync every 30 seconds
            if (timeRef.current >= 30) {
               syncTime();
            }
        }, 1000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
      syncTime(); // Final sync
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  return null; // Invisible component
}
