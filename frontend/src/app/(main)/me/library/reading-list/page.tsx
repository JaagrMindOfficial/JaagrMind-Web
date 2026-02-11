'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getSavedPosts, Post } from '@/lib/api';
import { ArticleCard } from '@/components/ArticleCard';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ReadingListPage() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNum: number) => {
    try {
      const res = await getSavedPosts(pageNum, 10);
      if (res.data) {
        if (pageNum === 1) {
          setPosts(res.data);
        } else {
          setPosts(prev => [...prev, ...res.data]);
        }
        setHasMore(res.data.length === 10);
      }
    } catch (error) {
      console.error('Error fetching reading list:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts(1);
    } else {
        setLoading(false);
    }
  }, [isAuthenticated]);

  const loadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
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
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <h2 className="text-2xl font-bold font-serif">Reading list</h2>
        <span className="text-muted-foreground text-sm">{posts.length} stories</span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Your reading list is empty.
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.id} className="border-b border-border pb-8 last:border-0">
               <ArticleCard post={post} compact={true} />
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
