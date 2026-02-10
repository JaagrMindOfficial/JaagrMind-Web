'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Reply, Trash2 } from 'lucide-react';
import { apiFetch, Comment, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CommentManagerProps {
    postId: string;
}

interface CommentItemProps {
    comment: Comment;
    user: User | null;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyText: string;
    setReplyText: (text: string) => void;
    handleReply: (parentId: string) => void;
    handleDelete: (commentId: string) => void;
    submitting: boolean;
    isReply?: boolean;
}

function CommentItem({ 
    comment, 
    user, 
    replyingTo, 
    setReplyingTo, 
    replyText, 
    setReplyText, 
    handleReply, 
    handleDelete,
    submitting,
    isReply = false 
}: CommentItemProps) {
     const isAuthor = comment.author?.user_id === user?.id;

    return (
      <div className={`group relative transition-all duration-200 ${
        isReply 
            ? 'ml-6 mt-3 pl-4 border-l-2 border-border hover:border-accent/30' 
            : 'py-5 border-b border-border last:border-0'
      }`}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium overflow-hidden ring-2 ring-transparent transition-all ${
              isAuthor ? 'bg-accent text-white ring-accent/20' : 'bg-muted text-muted-foreground'
          }`}>
             {comment.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
             ) : (
                (comment.author?.display_name || comment.author?.username || 'U')[0].toUpperCase()
             )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isAuthor ? 'text-accent' : 'text-foreground'}`}>
                        {comment.author?.display_name || comment.author?.username || 'Unknown'}
                    </span>
                    {isAuthor && (
                         <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent font-medium border border-accent/20">
                            AUTHOR
                         </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                </div>
                
                {/* Delete Action (Top right for better access) */}
                <button 
                    onClick={() => {
                        if (window.confirm('Are you sure you want to delete this comment?')) {
                            handleDelete(comment.id);
                        }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200"
                    title="Delete comment"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content */}
            <div className={`text-sm leading-relaxed whitespace-pre-line mb-2 p-3 rounded-lg ${
                isAuthor ? 'bg-accent/5 text-foreground/90' : 'text-muted-foreground'
            }`}>
                {comment.content}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className={`text-xs flex items-center gap-1.5 transition-colors font-medium px-2 py-1 rounded-md ${
                        replyingTo === comment.id 
                            ? 'bg-accent/10 text-accent' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                 >
                    <Reply className="w-3.5 h-3.5" />
                    {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                 </button>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
                <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200 pl-1">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.author?.display_name || 'user'}...`}
                            className="w-full pl-4 pr-10 py-2.5 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReply(comment.id);
                                }
                            }}
                        />
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline-block">Press Enter</span>
                         </div>
                    </div>
                    <button
                        onClick={() => handleReply(comment.id)}
                        disabled={submitting || !replyText.trim()}
                        className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
            <div className="mt-1">
                {comment.replies.map((reply) => (
                    <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        isReply={true}
                        user={user}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        handleReply={handleReply}
                        handleDelete={handleDelete}
                        submitting={submitting}
                    />
                ))}
            </div>
        )}
      </div>
    );
}

export function CommentManager({ postId }: CommentManagerProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  async function fetchComments() {
    try {
      setLoading(true);
      const res = await apiFetch<Comment[]>(`/posts/${postId}/comments`);
      if (res.success && res.data) {
        setComments(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiFetch<Comment>(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText,
          parentId,
        }),
      });

      if (res.success && res.data) {
        await fetchComments(); // Refresh to show new reply
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
      try {
          const res = await apiFetch(`/posts/${postId}/comments/${commentId}`, {
              method: 'DELETE',
          });
          if (res.success) {
              await fetchComments();
          }
      } catch (error) {
          console.error('Failed to delete comment:', error);
          alert('Failed to delete comment');
      }
  }

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted mb-4" />
              <div className="h-4 w-32 bg-muted rounded" />
          </div>
      );
  }

  if (comments.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl m-4">
              <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No comments yet</p>
              <p className="text-xs">Be the first to start the conversation</p>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-1 pb-10">
        <div className="text-right mb-4">
             <span className="text-xs text-muted-foreground font-medium">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
             </span>
        </div>
        {comments.map((comment) => (
            <CommentItem 
                key={comment.id} 
                comment={comment} 
                user={user}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                handleReply={handleReply}
                handleDelete={handleDelete}
                submitting={submitting}
            />
        ))}
    </div>
  );
}
