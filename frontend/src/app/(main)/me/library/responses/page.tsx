'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getResponses } from '@/lib/api';
import { Loader2, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ResponseItem {
  id: string;
  content: string;
  created_at: string;
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function ResponsesPage() {
  const { isAuthenticated } = useAuth();
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchResponses = async (pageNum: number) => {
    try {
      const res = await getResponses(pageNum, 10);
      if (res.data) {
        if (pageNum === 1) {
          setResponses(res.data);
        } else {
          setResponses(prev => [...prev, ...res.data]);
        }
        setHasMore(res.data.length === 10);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses(1);
    } else {
        setLoading(false);
    }
  }, [isAuthenticated]);

  const loadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResponses(nextPage);
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
      {responses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          You haven&apos;t written any responses yet.
        </div>
      ) : (
        <div className="space-y-6">
          {responses.map((response) => (
            <div key={response.id} className="border border-border rounded-lg p-6 hover:bg-accent/5 transition-colors">
               <Link href={`/post/${response.post?.slug}`} className="block">
                 <p className="text-sm text-muted-foreground mb-2">
                   On <span className="font-medium text-foreground">{response.post?.title}</span>
                 </p>
                 <div className="flex items-start gap-3">
                   <MessageCircle className="w-4 h-4 text-muted mt-1 flex-shrink-0" />
                   <div className="prose prose-sm dark:prose-invert line-clamp-3">
                     {response.content.replace(/<[^>]*>?/gm, '')} {/* Strip HTML for preview */}
                   </div>
                 </div>
                 <p className="text-xs text-muted-foreground mt-4">
                   {new Date(response.created_at).toLocaleDateString()}
                 </p>
               </Link>
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
