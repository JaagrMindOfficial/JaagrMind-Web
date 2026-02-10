import Link from 'next/link';
import { format } from 'date-fns';
import { BookmarkPlus, MoreHorizontal, ThumbsUp, MessageCircle } from 'lucide-react';
import { Post } from '@/lib/api';

// Get image URL helper (for S3 URLs)
function getImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl;
}

export function ArticleCard({ post }: { post: Post }) {
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

  return (
    <article className="py-6 border-b border-border group first:pt-0">
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
                      {authorName[0]?.toUpperCase() || 'J'}
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
            <Link href={`/@${post.author?.profiles?.username || 'user'}/${post.slug}`} className="group-hover:opacity-100 block mb-2">
              <h2 className="text-xl font-bold font-serif mb-1 text-foreground leading-tight line-clamp-2 decoration-offset-4 decoration-2">
                {post.title}
              </h2>
              {post.subtitle && (
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
                <button className="p-1 hover:text-foreground text-muted-foreground transition-colors">
                  <BookmarkPlus className="w-5 h-5 stroke-[1.5]" />
                </button>
                <button className="p-1 hover:text-foreground text-muted-foreground transition-colors">
                   <MoreHorizontal className="w-5 h-5 stroke-[1.5]" />
                </button>
             </div>

             {/* Right Stats (Date, Claps, Comments) */}
             <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{publishDate}</span>
                <div className="flex items-center gap-1">
                   <ThumbsUp className="w-4 h-4" />
                   <span>{claps}</span>
                </div>
                <div className="flex items-center gap-1">
                   <MessageCircle className="w-4 h-4" />
                   <span>{comments}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Image */}
        {coverImageUrl && (
          <div className="flex-shrink-0 w-20 h-20 sm:w-32 sm:h-32 bg-muted rounded-md overflow-hidden self-center sm:self-start sm:mt-8">
            <Link href={`/@${post.author?.profiles?.username || 'user'}/${post.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={coverImageUrl} 
                alt="" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
