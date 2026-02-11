'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { MoreHorizontal, MessageCircle } from 'lucide-react';
import { Clap } from '@/components/icons/Clap';
import { Post } from '@/lib/api';
import { SaveButton } from '@/components/SaveButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuth } from '@/contexts/AuthContext';
import { followUser, unfollowUser } from '@/lib/api';
import { useState } from 'react';

// Get image URL helper (for S3 URLs)
function getImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl;
}

export function ArticleCard({ post, compact = false }: { post: Post; compact?: boolean }) {

  const coverImageUrl = getImageUrl(post.cover_url);
  const authorAvatarUrl = getImageUrl(post.author?.profiles?.avatar_url);
  const authorName = post.author?.profiles?.display_name || post.author?.profiles?.username || 'JaagrMind';
  const publishDate = post.published_at 
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : format(new Date(post.created_at), 'MMM d, yyyy');
  
  // Use first topic if available
  const topic = post.topics?.[0];

    // Use real stats (or 0 if not available)
  const claps = post.clap_count || 0;
  const comments = post.comment_count || 0;

  const { user, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(post.author?.is_following || false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

  const handleFollow = async () => {
    if (!isAuthenticated || !post.author_id) return;
    
    setIsUpdatingFollow(true);
    try {
      if (isFollowing) {
        await unfollowUser(post.author_id);
        setIsFollowing(false);
      } else {
        await followUser(post.author_id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  return (
    <article className={`${compact ? 'py-5' : 'py-6'} border-b border-border first:pt-0`}>
      <div className="flex justify-between gap-8 sm:gap-12">
        {/* Left Column: Content & Meta */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Top: Author & Context */}
            <div className="flex items-center gap-2 text-xs mb-2">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-accent/10 flex-shrink-0">
                 {authorAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-accent">
                      {(authorName && authorName[0] ? authorName[0].toUpperCase() : 'J')}
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-1 text-foreground">
                <span className="font-medium">{authorName}</span>
                {topic && (
                  <>
                    <span className="text-muted-foreground">in</span>
                     <Link 
                      href={`/topic/${topic.slug}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {topic.name}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Middle: Title/Content */}
            <Link href={`/@${post.author?.profiles?.username || 'user'}/${post.slug}`} className="block mb-2 group">
              <h2 className="text-xl font-bold font-serif mb-1 text-foreground leading-tight line-clamp-2 group-hover:decoration-current decoration-offset-4 decoration-2">
                {post.title}
              </h2>
              {!compact && post.subtitle && (
                <p className="text-muted-foreground text-sm font-serif leading-relaxed line-clamp-2 sm:line-clamp-2 mt-1">
                  {post.subtitle}
                </p>
              )}
            </Link>
          </div>
          
          {/* Bottom: Footer Actions & Stats (Aligned Left, under text) */}
          <div className="flex items-center justify-between mt-auto">
             {/* Left Actions */}
             <div className="flex items-center gap-3">
                <SaveButton 
                  postId={post.id} 
                  initialIsSaved={post.is_saved} 
                  className="p-1 hover:bg-transparent" // Override base styles to match card
                />
                
                <Dropdown
                   trigger={
                      <button className="p-1 hover:text-foreground text-muted-foreground transition-colors group/more">
                         <MoreHorizontal className="w-5 h-5 stroke-[1.5] group-hover/more:scale-110 transition-transform" />
                      </button>
                   }
                >
                   <div className="py-1 min-w-[160px]">
                      {isAuthenticated && post.author_id !== user?.id ? (
                        <button 
                          onClick={handleFollow}
                          disabled={isUpdatingFollow}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent/10 text-foreground transition-colors disabled:opacity-50"
                        >
                          {isFollowing ? 'Unfollow Author' : 'Follow Author'}
                        </button>
                      ) : !isAuthenticated ? (
                         <Link href="/login" className="block w-full text-left px-4 py-2 text-sm hover:bg-accent/10 text-foreground transition-colors">
                           Log in to follow
                         </Link>
                      ) : (
                        <div className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                           No actions available
                        </div>
                      )}
                   </div>
                </Dropdown>
             </div>

             {/* Right Stats (Date, Claps, Comments) */}
             <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{publishDate}</span>
                <Tooltip content={`${claps} clap${claps !== 1 ? 's' : ''}`}>
                  <div className="flex items-center gap-1 group/clap cursor-pointer">
                     <Clap className="w-[18px] h-[18px] group-hover/clap:scale-110 transition-transform" />
                     <span>{claps}</span>
                  </div>
                </Tooltip>
                
                <Tooltip content={`${comments} response${comments !== 1 ? 's' : ''}`}>
                  <div className="flex items-center gap-1 group/comment cursor-pointer">
                     <MessageCircle className="w-[18px] h-[18px] group-hover/comment:scale-110 transition-transform" />
                     <span>{comments}</span>
                  </div>
                </Tooltip>
             </div>
          </div>
        </div>

        {/* Right Column: Image */}
        {coverImageUrl && (
          <div className="flex-shrink-0 w-20 h-20 sm:w-32 sm:h-32 bg-muted rounded-md overflow-hidden self-center sm:self-start sm:mt-8 group/image">
            <Link href={`/@${post.author?.profiles?.username || 'user'}/${post.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={coverImageUrl} 
                alt="" 
                className="w-full h-full object-cover transform group-hover/image:scale-105 transition-transform duration-500"
              />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
