import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import { getPostByUsernameAndSlug, renderContent } from '@/lib/api';
import { ClapsButton } from '@/components/ClapsButton';
import { ShareButton } from '@/components/ShareButton';
import { CommentsSection } from '@/components/CommentsSection';
import { ReadingTracker } from '@/components/ReadingTracker';
import { FollowButton } from '@/components/FollowButton';
import { SaveButton } from '@/components/SaveButton';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

// Get image URL helper (S3 URLs are already full URLs)
function getImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  
  // Clean username if needed (should already be decoded by Next.js, but just in case)
  const decodedUsername = decodeURIComponent(username);
  
  const post = await getPostByUsernameAndSlug(decodedUsername, slug);

  if (!post) {
    return { title: 'Post Not Found | JaagrMind' };
  }

  const authorName = post.author?.profiles?.display_name || post.author?.profiles?.username || 'JaagrMind';

  return {
    title: `${post.title} | JaagrMind`,
    description: post.subtitle || `Read ${post.title} on JaagrMind`,
    openGraph: {
      title: post.title,
      description: post.subtitle || undefined,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      authors: [authorName],
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { username, slug } = await params;
  const decodedUsername = decodeURIComponent(username);
  
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const post = await getPostByUsernameAndSlug(decodedUsername, slug, token);

  if (!post) {
    notFound();
  }

  const coverImageUrl = getImageUrl(post.cover_url);
  const authorAvatarUrl = getImageUrl(post.author?.profiles?.avatar_url);
  const authorName = post.author?.profiles?.display_name || post.author?.profiles?.username || 'JaagrMind';
  const publishDate = post.published_at 
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : format(new Date(post.created_at), 'MMM d, yyyy');

  return (
    <>
      <ReadingTracker postId={post.id} />
      <article className="w-full max-w-[680px] px-6 py-6">
        {/* Title Section */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">
            {post.title}
          </h1>
          
          {post.subtitle && (
            <p className="text-lg text-muted mb-4">
              {post.subtitle}
            </p>
          )}

          {/* Author Info */}
          <div className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-border flex-shrink-0">
              {authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={authorAvatarUrl}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted bg-accent/10">
                  {authorName[0]?.toUpperCase() || 'J'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {authorName}
                </span>
                <span className="text-xs text-muted">·</span>
                {post.author_id && (
                    <FollowButton 
                        userId={post.author_id} 
                        initialIsFollowing={post.author?.is_following}
                        className="!p-0 !bg-transparent !text-accent hover:!underline border-none"
                        size="sm"
                    />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                {post.reading_time && <span>{post.reading_time} min read</span>}
                <span>·</span>
                <span>{publishDate}</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between py-2 border-y border-border">
            <div className="flex items-center gap-4">
              <ClapsButton postId={post.id} initialCount={post.clap_count || 0} />
              <a href="#comments" className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">{post.comment_count || 0} Comments</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <SaveButton 
                postId={post.id} 
                initialIsSaved={post.is_saved} 
                className="p-1.5 hover:bg-accent/10 rounded-full"
              />
              <ShareButton url={`/@${decodedUsername.replace('@', '')}/${post.slug}`} title={post.title} />
              <button className="p-1.5 hover:bg-accent/10 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5 text-muted" />
              </button>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {coverImageUrl && (
          <figure className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt={post.title}
              className="w-full h-auto rounded"
            />
          </figure>
        )}

        {/* Content */}
        <div 
          className="article-compact prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content || []) }}
        />

        {/* Topics */}
        {post.topics && post.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
            {post.topics.map((topic) => (
              <span
                key={topic.id}
                className="px-3 py-1.5 text-xs bg-border/50 rounded-full hover:bg-border transition-colors cursor-pointer"
              >
                {topic.name}
              </span>
            ))}
          </div>
        )}

        {/* Author Footer */}
        <footer className="mt-8 pt-6 border-t border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-border flex-shrink-0">
              {authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={authorAvatarUrl}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-medium text-muted bg-accent/10">
                  {authorName[0]?.toUpperCase() || 'J'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm">
                  Written by {authorName}
                </p>
                {post.author_id && (
                    <FollowButton 
                        userId={post.author_id} 
                        initialIsFollowing={post.author?.is_following}
                    />
                )}
              </div>
              {post.author?.profiles?.bio && (
                <p className="text-sm text-muted">{post.author.profiles.bio}</p>
              )}
            </div>
          </div>
        </footer>

        {/* Comments Section */}
        <CommentsSection postId={post.id} postSlug={post.slug} postAuthorId={post.author_id} />
      </article>
    </>
  );
}
