'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { followUser, unfollowUser } from '@/lib/api';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  onToggle?: (isFollowing: boolean) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function FollowButton({ 
  userId, 
  initialIsFollowing = false, 
  onToggle,
  className = '',
  size = 'sm'
}: FollowButtonProps) {
  const router = useRouter();
  const { isAuthenticated, user, isFollowing: checkIsFollowing, updateFollowing } = useAuth();
  
  // Use global state if available, otherwise fallback to prop/local
  const isFollowed = isAuthenticated && user?.id !== userId 
    ? checkIsFollowing(userId) 
    : initialIsFollowing;

  const [isLoading, setIsLoading] = useState(false);

  // Don't show button for self
  if (isAuthenticated && user?.id === userId) {
    return null;
  }

  const handleFollow = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isLoading) return;

    const newState = !isFollowed;
    
    // Optimistic update via Context
    updateFollowing(userId, newState);
    if (onToggle) onToggle(newState);

    // Dispatch custom event for other components (legacy support)
    window.dispatchEvent(new Event('user-follow-change'));

    setIsLoading(true);

    try {
      if (newState) {
        await followUser(userId);
      } else {
        await unfollowUser(userId);
      }
    } catch {
      // Revert on error
      updateFollowing(userId, !newState);
      if (onToggle) onToggle(!newState);
    } finally {
      setIsLoading(false);
      // router.refresh(); // Removed to prevent full page reload, state is handled by AuthContext
    }
  };

  const baseClasses = "rounded-full font-medium transition-colors duration-200 flex-shrink-0";
  const sizeClasses = size === 'sm' 
    ? "px-3 py-1 text-xs" 
    : "px-4 py-1.5 text-sm";
  
  const variantClasses = isFollowed
    ? "bg-transparent border border-foreground text-foreground hover:bg-muted/10"
    : "bg-accent text-white border border-transparent hover:bg-accent/90";

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
    >
      {isFollowed ? 'Following' : 'Follow'}
    </button>
  );
}
