'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getHistory, Post } from '@/lib/api';
import { ArticleCard } from '@/components/ArticleCard';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Extend Post type to include last_read_at which comes from history API
interface HistoryPost extends Post {
  last_read_at?: string;
}

export default function ReadingHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<HistoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = async (pageNum: number) => {
    try {
      const res = await getHistory(pageNum, 10);
      if (res.data) {
        if (pageNum === 1) {
          setPosts(res.data);
        } else {
          setPosts(prev => [...prev, ...res.data]);
        }
        setHasMore(res.data.length === 10);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory(1);
    } else {
        setLoading(false);
    }
  }, [isAuthenticated]);

  const loadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          You haven&apos;t read any stories yet.
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
             <div key={post.id} className="border-b border-border pb-8 last:border-0 relative">
               <ArticleCard post={post} />
               <div className="absolute top-0 right-0 text-[10px] text-muted-foreground bg-accent/5 px-2 py-1 rounded">
                  Read {new Date(post.last_read_at || '').toLocaleDateString()}
               </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 rounded-full border border-border hover:bg-accent/5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
