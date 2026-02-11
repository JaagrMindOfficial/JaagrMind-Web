'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { User, getProfile, getPosts, getMyFollowingIds, followUser, unfollowUser, Post } from '@/lib/api';
import { ArticleCard } from '@/components/ArticleCard';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserProfilePage() {
  const params = useParams();
  // decodeURIComponent to handle potential URL encoding
  const username = decodeURIComponent(params.username as string).replace('@', '');
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'home' | 'about'>('home');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingProfile(true);
        const user = await getProfile(username);
        
        if (user) {
          setProfile(user);
          // @ts-expect-error - follower_count is injected by backend but not in User type yet
          setFollowersCount(user.follower_count || 0);

          // Check following status if logged in
          if (currentUser && user.id !== currentUser.id) {
             const followingIds = await getMyFollowingIds();
             setIsFollowing(followingIds.includes(user.id));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    }

    if (username) {
      fetchData();
    }
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!profile || !currentUser) return;
    try {
      if (isFollowing) {
        await unfollowUser(profile.id);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await followUser(profile.id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        User not found.
      </div>
    );
  }

  return (
    <div className="container max-w-[1200px] mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {profile.profiles?.display_name || profile.profiles?.username}
            </h1>
            <button className="text-muted-foreground hover:text-foreground">
               <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('home')}
                className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'home'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'about'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                About
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'home' ? (
            <div className="space-y-8">
               <PostsList authorId={profile.id} />
            </div>
          ) : (
             <div className="prose dark:prose-invert">
                <p>{profile.profiles?.bio || 'No bio available.'}</p>
             </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-[320px] shrink-0 space-y-8 pl-8 border-l border-border/50">
           {/* Author Info Card */}
           <div className="sticky top-24">
              <div className="mb-4">
                 <div className="w-24 h-24 rounded-full overflow-hidden bg-accent/10 mb-4">
                    {profile.profiles?.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={profile.profiles?.avatar_url} 
                        alt={profile.profiles?.display_name || ''} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-medium text-accent">
                        {(profile.profiles?.display_name?.[0] || profile.profiles?.username?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                 </div>
                 <h2 className="text-lg font-bold mb-1">
                   {profile.profiles?.display_name || profile.profiles?.username}
                 </h2>
                 <div className="text-muted-foreground text-sm mb-4">
                    {followersCount.toLocaleString()} followers
                 </div>
                 <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                   {profile.profiles?.bio || 'Short description about the author goes here.'}
                 </p>
                 
                 <div className="flex gap-2">
                    {currentUser?.id !== profile.id && (
                       <button 
                         onClick={handleFollow}
                         className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            isFollowing 
                              ? 'border border-border hover:bg-accent/5' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                         }`}
                       >
                         {isFollowing ? 'Following' : 'Follow'}
                       </button>
                    )}
                    {/* Email/Subscribe button could go here */}
                 </div>
              </div>
              
              {/* Following List Placeholder - User requested "Following" section but said "don't implement who the author is following function yet".
                  Wait, looking at screenshot 2, there is a "Following" list on the right. 
                  The user said "don't implement who the author is following function. yet."
                  So I will skip the list below the bio for now per instructions.
               */}
           </div>
        </aside>
      </div>
    </div>
  );
}

// Helper component to fetch and display posts
function PostsList({ authorId }: { authorId: string }) {
   const [posts, setPosts] = useState<Post[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function loadPosts() {
         try {
             // Fetching page 1 (up to 100) and filtering manually for now
             const res = await getPosts(1, 100); 
             if (res.data) {
                const userPosts = res.data.filter(p => p.author_id === authorId || p.author?.id === authorId);
                setPosts(userPosts);
             }
         } catch (e) {
            console.error(e);
         } finally {
            setLoading(false);
         }
      }
      loadPosts();
   }, [authorId]);

   if (loading) return <div className="py-4"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>;
   
   if (posts.length === 0) return <div className="text-muted-foreground italic">No stories published yet.</div>;

   return (
      <div className="space-y-0"> 
         {/* Standard Feed Style: Border items */}
         {posts.map(post => (
            <ArticleCard key={post.id} post={post} />
         ))}
      </div>
   );
}
