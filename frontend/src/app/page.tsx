import { Metadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import { getPosts, Post } from '@/lib/api';
import { Header } from '@/components/Header';
import { LeftSidebar } from '@/components/LeftSidebar';
import { ArticleCard } from '@/components/ArticleCard';

export const metadata: Metadata = {
  title: 'JaagrMind - Empowering Education Through Knowledge',
  description: 'Discover insights on education, learning strategies, and academic excellence for schools, students, and parents.',
  openGraph: {
    title: 'JaagrMind - Empowering Education Through Knowledge',
    description: 'Discover insights on education, learning strategies, and academic excellence for schools, students, and parents.',
    type: 'website',
  },
};

// Sidebar Staff Pick Item
function StaffPickItem({ post }: { post: Post }) {
  const authorName = post.author?.profiles?.display_name || post.author?.profiles?.username || 'JaagrMind';
  const publishDate = post.published_at 
    ? format(new Date(post.published_at), 'MMM d')
    : format(new Date(post.created_at), 'MMM d');

  return (
    <Link href={`/@${post.author?.profiles?.username || 'user'}/${post.slug}`} className="block group py-2">
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

// Recommended Topic Pill
function TopicPill({ name }: { name: string }) {
  return (
    <Link 
      href="/" 
      className="inline-block px-3 py-1.5 bg-border/50 rounded-full text-xs hover:bg-border transition-colors"
    >
      {name}
    </Link>
  );
}

export default async function HomePage() {
  let posts: Post[] = [];
  let error: string | null = null;

  try {
    const response = await getPosts(1, 20);
    posts = response.data || [];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load posts';
  }

  const mainFeedPosts = posts.slice(0, 10);
  const staffPicks = posts.slice(0, 4);
  
  const recommendedTopics = [
    'Education', 'Learning', 'Teaching', 'Parenting', 
    'Student Life', 'Study Tips', 'Career'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Full-width layout with sidebars at edges */}
      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Left Sidebar - Fixed to left edge */}
        <div className="hidden lg:block w-56 flex-shrink-0 border-r border-border">
          <LeftSidebar />
        </div>

        {/* Main Content Area - Centered */}
        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-[680px] px-6 py-4">
            {/* Feed Tabs */}
            <div className="flex items-center gap-6 border-b border-border mb-8">
              <button className="text-sm font-medium text-foreground border-b border-foreground pb-3 -mb-px">
                For you
              </button>
              <button className="text-sm text-muted hover:text-foreground transition-colors pb-3 -mb-px">
                Following
              </button>
            </div>

            {/* Posts */}
            {error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted mb-3">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted mb-3">No posts yet</p>
                <div className="text-sm text-muted">
                  Check back later for new content
                </div>
              </div>
            ) : (
              <div>
                {mainFeedPosts.map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Fixed to right edge */}
        <aside className="hidden xl:block w-72 flex-shrink-0 border-l border-border">
          <div className="sticky top-14 p-6 h-[calc(100vh-56px)] overflow-y-auto">
            {/* Staff Picks */}
            <section className="mb-6">
              <h3 className="font-bold text-sm mb-3">Staff Picks</h3>
              <div className="divide-y divide-border">
                {staffPicks.map((post) => (
                  <StaffPickItem key={post.id} post={post} />
                ))}
              </div>
              <Link href="/" className="text-xs text-accent hover:underline mt-2 inline-block">
                See the full list
              </Link>
            </section>



            {/* Who to follow */}
            <section className="mb-6">
              <h3 className="font-bold text-sm mb-3">Who to follow</h3>
              <div className="space-y-3">
                {posts.slice(0, 3).map((post) => {
                  const authorName = post.author?.profiles?.display_name || post.author?.profiles?.username || 'JaagrMind';
                  return (
                    <div key={post.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-accent">
                          {authorName[0]?.toUpperCase() || 'J'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">
                          {authorName}
                        </p>
                        <p className="text-[11px] text-muted line-clamp-1">
                          {post.topics?.[0]?.name || 'Education expert'}
                        </p>
                      </div>
                      <button className="px-2.5 py-1 text-[11px] font-medium border border-foreground rounded-full hover:bg-foreground hover:text-background transition-colors flex-shrink-0">
                        Follow
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Footer Links */}
            <footer className="text-[11px] text-muted pt-4 border-t border-border">
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <Link href="/" className="hover:text-foreground">Help</Link>
                <Link href="/" className="hover:text-foreground">Status</Link>
                <Link href="/" className="hover:text-foreground">About</Link>
                <Link href="/" className="hover:text-foreground">Careers</Link>
                <Link href="/" className="hover:text-foreground">Privacy</Link>
                <Link href="/" className="hover:text-foreground">Terms</Link>
              </div>
            </footer>
          </div>
        </aside>
      </div>
    </div>
  );
}
