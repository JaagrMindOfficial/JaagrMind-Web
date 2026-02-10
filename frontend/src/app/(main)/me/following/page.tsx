'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getFollowing, User } from '@/lib/api';
import { UserCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FollowingPage() {
  const { isAuthenticated, followingIds } = useAuth();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      getFollowing(1, 50).then((res) => {
        if (res.data) setFollowing(res.data);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, followingIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl px-6 py-8">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-accent" />
          Following
        </h1>
        <p className="text-muted mt-2">People you are following.</p>
      </div>

      {following.length === 0 ? (
        <div className="text-center py-20 bg-accent/5 rounded-lg border border-border/50">
          <UserCheck className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">You are not following anyone yet</h3>
          <p className="text-muted mb-6">Discover amazing authors to follow.</p>
          <Link href="/explore" className="px-4 py-2 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors">
            Explore Authors
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {following.map((followedUser) => {
             const name = followedUser.profiles?.display_name || followedUser.profiles?.username || 'User';
             const username = followedUser.profiles?.username;
             const bio = followedUser.profiles?.bio;
             
             return (
               <Link
                 key={followedUser.id}
                 href={`/@${username}`}
                 className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors group"
               >
                 <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {followedUser.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={followedUser.profiles.avatar_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-medium text-accent">{name[0]?.toUpperCase()}</span>
                    )}
                 </div>
                 <div className="min-w-0">
                   <h3 className="font-medium text-foreground group-hover:text-accent truncate transition-colors">{name}</h3>
                   <p className="text-sm text-muted truncate">@{username}</p>
                   {bio && <p className="text-xs text-muted truncate mt-1">{bio}</p>}
                 </div>
               </Link>
             );
          })}
        </div>
      )}
    </div>
  );
}
