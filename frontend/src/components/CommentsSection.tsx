'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Reply, Trash2 } from 'lucide-react';
import { apiFetch, Comment, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface CommentsSectionProps {
  postId: string;
  postSlug: string;
  postAuthorId: string | null;
}

interface CommentItemProps {
  comment: Comment;
  user: User | null;
  postAuthorId: string | null;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  handleSubmit: (parentId?: string, content?: string) => void;
  handleDelete: (commentId: string) => void;
  submitting: boolean;
  isReply?: boolean;
}

function CommentItem({ 
  comment, 
  user, 
  postAuthorId,
  replyingTo, 
  setReplyingTo, 
  replyText, 
  setReplyText, 
  handleSubmit, 
  handleDelete,
  submitting,
  isReply = false 
}: CommentItemProps) {
  const isMe = user?.id === comment.user_id;
  const isPostAuthor = user?.id === postAuthorId;
  const isCommentAuthorPostAuthor = comment.author?.user_id === postAuthorId;
  
  // Permission checks
  const canDeleteOwn = user?.can_delete_own_comments !== false;
  const canDeleteOthers = user?.can_delete_others_comments === true;

  const canDelete = (isMe && canDeleteOwn) || (isPostAuthor && !isMe && canDeleteOthers);

  return (
    <div className={`group ${isReply ? 'ml-8 mt-4 pl-4 border-l-2 border-border' : 'py-6 border-b border-border last:border-0'}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-accent overflow-hidden">
           {comment.author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
           ) : (
              (comment.author?.display_name || comment.author?.username || 'U')[0].toUpperCase()
           )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                      {comment.author?.display_name || comment.author?.username || 'Unknown'}
                  </span>
                  {isCommentAuthorPostAuthor && (
                       <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent text-white font-medium">
                          AUTHOR
                       </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
              </div>
              
              {canDelete && (
                  <button 
                    onClick={() => {
                        if (confirm('Delete this comment?')) {
                            handleDelete(comment.id);
                        }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 rounded transition-all"
                    title="Delete comment"
                  >
                      <Trash2 className="w-4 h-4" />
                  </button>
              )}
          </div>

          {/* Content */}
          <p className="text-sm text-foreground/90 mb-3 leading-relaxed whitespace-pre-line font-serif">
              {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-6">
               {user && (
                   <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium"
                   >
                      <Reply className="w-4 h-4" />
                      Reply
                   </button>
               )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
              <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                   <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-accent overflow-hidden">
                      {user?.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                          (user?.profiles?.display_name?.[0] || user?.email?.[0] || 'U').toUpperCase()
                      )}
                  </div>
                  <div className="flex-1">
                      <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent min-h-[80px] resize-y"
                          autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                           <button
                              onClick={() => setReplyingTo(null)}
                              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                           >
                              Cancel
                           </button>
                           <button
                              onClick={() => handleSubmit(comment.id, replyText)}
                              disabled={submitting || !replyText.trim()}
                              className="px-3 py-1.5 bg-accent text-white rounded-full text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                          >
                              Reply
                          </button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 text-sm"> {/* Added text-sm context barrier */}
              {comment.replies.map((reply) => (
                  <CommentItem 
                    key={reply.id} 
                    comment={reply} 
                    user={user}
                    postAuthorId={postAuthorId}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    handleSubmit={handleSubmit}
                    handleDelete={handleDelete}
                    submitting={submitting}
                    isReply={true} 
                  />
              ))}
          </div>
      )}
    </div>
  );
}

export function CommentsSection({ postId, postSlug, postAuthorId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
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
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(parentId?: string, content?: string) {
    const text = content || commentText;
    if (!text.trim()) return;

    if (!user) return;

    setSubmitting(true);
    try {
      const res = await apiFetch<Comment>(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          parentId,
        }),
      });

      if (res.success && res.data) {
        await fetchComments(); 
        if (parentId) {
            setReplyText('');
            setReplyingTo(null);
        } else {
            setCommentText('');
        }
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
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
          } else {
              alert(res.error || 'Failed to delete comment');
          }
      } catch (error) {
          console.error('Failed to delete comment:', error);
          alert('Failed to delete comment');
      }
  }

  return (
    <div id="comments" className="max-w-[680px] mx-auto py-12">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            Responses 
            <span className="text-muted-foreground font-medium text-lg">({comments.length})</span>
        </h3>

        {/* Main Input Area */}
        <div className="mb-10 p-6 bg-muted/30 rounded-xl border border-border/50 shadow-sm">
            {user ? (
                <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-accent overflow-hidden">
                        {user.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            (user.profiles?.display_name?.[0] || user.email?.[0] || 'U').toUpperCase()
                        )}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="What are your thoughts?"
                            className="w-full px-4 py-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent min-h-[100px] resize-y placeholder:text-muted-foreground/70"
                        />
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={() => handleSubmit()}
                                disabled={submitting || !commentText.trim()}
                                className="px-5 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-all shadow-sm hover:shadow"
                            >
                                Respond
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                        Sign in to leave a response and join the conversation.
                    </p>
                    <Link
                        href={`/login?redirect=/blog/${postSlug}%23comments`}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors"
                    >
                        Sign in to respond
                    </Link>
                </div>
            )}
        </div>

        {/* Comments List */}
        {loading ? (
             <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        ) : comments.length === 0 ? (
            <div className="text-center py-12 border-t border-border border-dashed">
                <p className="text-muted-foreground italic">No responses yet. Be the first to share your thoughts!</p>
            </div>
        ) : (
            <div className="space-y-2">
                {comments.map((comment) => (
                    <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        user={user}
                        postAuthorId={postAuthorId}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        handleSubmit={handleSubmit}
                        handleDelete={handleDelete}
                        submitting={submitting}
                    />
                ))}
            </div>
        )}
    </div>
  );
}
