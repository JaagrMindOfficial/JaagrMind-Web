'use client';

import { useState, useEffect } from 'react';
import { X, Eye, ThumbsUp, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface UserStatsModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserStats {
  totalPosts: number;
  totalViews: number;
  totalClaps: number;
}

export function UserStatsModal({ userId, userName, isOpen, onClose }: UserStatsModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await apiFetch<UserStats>(`/admin/users/${userId}/stats`);
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && userId) {
      fetchStats();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
        window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
    >
      <div className="bg-background w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold font-serif line-clamp-1">Stats for {userName}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-accent/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Total Posts</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {loading ? '...' : stats?.totalPosts}
                    </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">Total Views</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {loading ? '...' : stats?.totalViews}
                    </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Total Claps</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {loading ? '...' : stats?.totalClaps}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
