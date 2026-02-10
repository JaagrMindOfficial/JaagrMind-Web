import { Metadata } from 'next';
import { getPosts, getStaffPicks, getWhoToFollow, Post, User } from '@/lib/api';
import { Header } from '@/components/Header';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
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

export default async function HomePage() {
  let posts: Post[] = [];
  let staffPicks: Post[] = [];
  let whoToFollow: User[] = [];
  let error: string | null = null;

  try {
    const [postsRes, staffPicksRes, whoToFollowRes] = await Promise.all([
      getPosts(1, 20),
      getStaffPicks(3),
      getWhoToFollow(3)
    ]);
    posts = postsRes.data || [];
    staffPicks = staffPicksRes || [];
    whoToFollow = whoToFollowRes || [];

  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load content';
  }

  const mainFeedPosts = posts;
  
  const recommendedTopics = [
    'Education', 'Learning', 'Teaching', 'Parenting', 
    'Student Life', 'Study Tips', 'Career'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Full-width layout with sidebars at edges */}
      <div className="flex min-h-[calc(100vh-56px)] justify-between">
        {/* Left Sidebar - Fixed to left edge */}
        <div className="hidden lg:block w-64 flex-shrink-0 border-r border-border">
          <LeftSidebar />
        </div>

        {/* Main Content Area - Centered */}
        <main className="flex-1 flex justify-center w-full px-6 py-4">
          <div className="w-full max-w-[680px]">
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
        <RightSidebar 
          staffPicks={staffPicks} 
          whoToFollow={whoToFollow} 
          recommendedTopics={recommendedTopics} 
        />
      </div>
    </div>
  );
}
