'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getLibraryStats } from '@/lib/api';
import { Lock, MoreHorizontal, Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LibraryListsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ savedCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLibraryStats().then((res) => {
      if (res) {
        setStats(res);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Reading List Card */}
      <Link href="/me/library/reading-list" className="block group bg-card hover:bg-accent/5 rounded-xl p-6 border border-border transition-all cursor-pointer flex justify-between items-center sm:items-start gap-6">
        <div className="flex-1">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
             <div className="w-6 h-6 rounded-full bg-accent/20 overflow-hidden">
                {user?.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-accent">
                    {user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
             </div>
             <span className="text-sm font-medium text-foreground">
                {user?.profiles?.display_name || user?.profiles?.username || 'User'}
             </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold font-serif mb-2 group-hover:underline decoration-foreground/30 underline-offset-4">
            Reading list
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{loading ? '...' : `${stats.savedCount} posts`}</span>
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Thumbnail Collage (Right Side) */}
        <div className="hidden sm:flex relative w-48 h-32 bg-input rounded-lg border border-border overflow-hidden">
            {/* Mock covers */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                 <Bookmark className="w-8 h-8 text-muted/30" />
            </div>
            {/* If we had images, we'd overlay them here. Using placeholder for now. */}
            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </div>
  );
}
