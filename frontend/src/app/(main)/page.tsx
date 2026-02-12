import { Metadata } from 'next';
import { getPosts, getStaffPicks, getWhoToFollow, Post, User } from '@/lib/api';
import { RightSidebar } from '@/components/RightSidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { cookies } from 'next/headers';

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
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    const [postsRes, staffPicksRes, whoToFollowRes] = await Promise.all([
      getPosts(1, 20, token),
      getStaffPicks(3, token),
      getWhoToFollow(3)
    ]);
    posts = postsRes.data || [];
    staffPicks = staffPicksRes || [];
    whoToFollow = whoToFollowRes || [];

  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load content';
  }

  const mainFeedPosts = posts;
  
  /* Fetch topics dynamically */
  let topics: import('@/lib/api').Topic[] = [];
  try {
      const topicsList = await import('@/lib/api').then(m => m.getAllTopics());
      // Filter for root topics only (no parent) and maybe limit to random 7?
      // For now, let's just show the first 7 root topics
      topics = topicsList.filter(t => !t.parent_id).slice(0, 10);
  } catch (err) {
      console.error('Failed to fetch topics for home page', err);
  }
  
  const recommendedTopics = topics.length > 0 ? topics.map(t => t.name) : [
    'Education', 'Learning', 'Teaching', 'Parenting', 
    'Student Life', 'Study Tips', 'Career'
  ];

  return (
    <div className="relative w-full flex justify-center px-6 py-4">
        {/* Main Feed - Explicitly Centered */}
        <div className="w-full max-w-[680px] z-10 xl:-translate-x-32">
          {/* Feed Tabs */}
          <div className="flex items-center gap-6 border-b border-border mb-8">
            <button className="text-sm font-medium text-foreground border-b border-foreground pb-3 -mb-px">
              For you
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

        {/* Right Sidebar - Tucked to the screen edge */}
        <div className="hidden xl:block absolute right-0 top-0 h-full pr-6 z-0">
            <RightSidebar 
              staffPicks={staffPicks} 
              whoToFollow={whoToFollow} 
              recommendedTopics={recommendedTopics} 
            />
        </div>
    </div>
  );
}
