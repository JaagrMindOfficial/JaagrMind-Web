'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { savePost, unsavePost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  postId: string;
  initialIsSaved?: boolean;
  className?: string; // Allow custom styling/layout
  size?: 'sm' | 'md' | 'lg' | 'icon'; // variant support if needed
  showLabel?: boolean;
}

export function SaveButton({ 
  postId, 
  initialIsSaved = false, 
  className,
  size = 'icon',
  showLabel = false
}: SaveButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent bubbling if inside a link
    e.stopPropagation();
    
    if (!isAuthenticated) {
        // ideally show login modal, for now just return
        return; 
    }
    if (loading) return;

    try {
      setLoading(true);
      // Optimistic update
      const newState = !isSaved;
      setIsSaved(newState);

      if (newState) {
        await savePost(postId);
      } else {
        await unsavePost(postId);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      // Revert on error
      setIsSaved(!isSaved);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSave}
      disabled={loading}
      className={cn(
        "transition-colors flex items-center gap-2",
        isSaved ? "text-green-600" : "text-muted-foreground hover:text-foreground",
        className
      )}
      title={isSaved ? "Remove from library" : "Save to library"}
    >
      <Bookmark 
        className={cn(
            "stroke-[1.5]", 
            isSaved ? "fill-green-600" : "",
            size === 'sm' ? "w-4 h-4" : "w-5 h-5"
        )} 
      />
      {showLabel && (
          <span className="text-sm font-medium">
              {isSaved ? "Saved" : "Save"}
          </span>
      )}
    </button>
  );
}
