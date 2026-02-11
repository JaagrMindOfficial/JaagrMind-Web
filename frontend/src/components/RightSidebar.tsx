'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Post, User } from '@/lib/api';
import { FollowButton } from '@/components/FollowButton';
import { useAuth } from '@/contexts/AuthContext';

interface RightSidebarProps {
  staffPicks: Post[];
  whoToFollow: User[];
  recommendedTopics: string[];
}

function StaffPickItem({ post }: { post: Post }) {
  const authorName = post.author?.profiles?.display_name || post.author?.profiles?.username || 'JaagrMind';
  const publishDate = post.published_at 
    ? format(new Date(post.published_at), 'MMM d')
    : format(new Date(post.created_at), 'MMM d');
  const userSlug = post.author?.profiles?.username || 'user';

  return (
    <Link href={`/@${userSlug}/${post.slug}`} className="block group py-2">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-4 h-4 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] font-medium text-accent">
            {authorName[0]?.toUpperCase() || 'J'}
          </span>
        </div>
        <span className="text-xs text-muted truncate">
          {authorName}
        </span>
      </div>
      <h3 className="font-bold text-sm leading-tight group-hover:text-accent transition-colors line-clamp-2">
        {post.title}
      </h3>
      <span className="text-xs text-muted">{publishDate}</span>
    </Link>
  );
}

function TopicPill({ name }: { name: string }) {
  return (
    <Link 
      href={`/topic/${name.toLowerCase().replace(/\s+/g, '-')}`} 
      className="inline-block px-3 py-1.5 bg-border/50 rounded-full text-xs hover:bg-border transition-colors"
    >
      {name}
    </Link>
  );
}

export function RightSidebar({ staffPicks, whoToFollow: initialWhoToFollow, recommendedTopics }: RightSidebarProps) {
  const { isFollowing, isAuthenticated, user } = useAuth();
  
  // Filter out users we are already following
  // This handles the case where SSR returns them because it was anonymous
  const whoToFollow = initialWhoToFollow.filter(u => {
    if (!isAuthenticated) return true;
    if (u.id === user?.id) return false;
    return !isFollowing(u.id);
  });

  return (
    <aside className="hidden xl:block w-72 flex-shrink-0 border-l border-border">
      <div className="sticky top-14 p-6 h-[calc(100vh-56px)] overflow-y-auto no-scrollbar">
        
        {/* Staff Picks */}
        <section className="mb-8">
          <h3 className="font-bold text-sm mb-3">Staff Picks</h3>
          <div className="divide-y divide-border">
            {staffPicks.length > 0 ? (
              staffPicks.map((post) => (
                <StaffPickItem key={post.id} post={post} />
              ))
            ) : (
              <p className="text-xs text-muted py-2">No staff picks yet.</p>
            )}
          </div>
          <Link href="/staff-picks" className="text-xs text-accent hover:underline mt-3 inline-block">
            See the full list
          </Link>
        </section>

        {/* Recommended Topics */}
        <section className="mb-8">
          <h3 className="font-bold text-sm mb-3">Recommended Topics</h3>
          <div className="flex flex-wrap gap-2">
            {recommendedTopics.map((topic) => (
              <TopicPill key={topic} name={topic} />
            ))}
          </div>
          <Link href="/topics" className="text-xs text-accent hover:underline mt-3 inline-block">
            See all topics
          </Link>
        </section>

        {/* Who to follow */}
        <section className="mb-8">
          <h3 className="font-bold text-sm mb-3">Who to follow</h3>
          <div className="space-y-4">
            {whoToFollow.length > 0 ? (
              whoToFollow.map((user) => {
                const authorName = user.profiles?.display_name || user.profiles?.username || 'User';
                const bio = user.profiles?.bio;
                const userSlug = user.profiles?.username || 'user';
                
                return (
                  <div key={user.id} className="flex items-start gap-3">
                    <Link href={`/@${userSlug}`} className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity">
                      {user.profiles?.avatar_url ? (
                        <img src={user.profiles.avatar_url} alt={authorName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-accent">
                          {authorName[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/@${userSlug}`} className="font-bold text-sm truncate hover:underline block">
                        {authorName}
                      </Link>
                      {bio && (
                        <p className="text-xs text-muted line-clamp-2 mt-0.5">
                          {bio}
                        </p>
                      )}
                    </div>
                    <FollowButton userId={user.id} initialIsFollowing={false} />
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted">No suggestions available.</p>
            )}
          </div>
          <Link href="/writers" className="text-xs text-accent hover:underline mt-3 inline-block">
            See more suggestions
          </Link>
        </section>

        {/* Footer Links */}
        <footer className="text-[11px] text-muted pt-4 border-t border-border">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/help" className="hover:text-foreground">Help</Link>
            <Link href="/status" className="hover:text-foreground">Status</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/careers" className="hover:text-foreground">Careers</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/text-to-speech" className="hover:text-foreground">Text to speech</Link>
            <Link href="/teams" className="hover:text-foreground">Teams</Link>
          </div>
        </footer>
      </div>
    </aside>
  );
}
