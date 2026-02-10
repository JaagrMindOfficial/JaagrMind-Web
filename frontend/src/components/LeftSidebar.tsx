'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  BookOpen, 
  User as UserIcon, 
  Compass,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getFollowing, User } from '@/lib/api';

export function LeftSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, followingIds } = useAuth();
  const [following, setFollowing] = useState<User[]>([]);
  const [isFollowingExpanded, setIsFollowingExpanded] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      getFollowing(1, 5).then((res) => {
        if (res.data) setFollowing(res.data);
      });
    }
  }, [followingIds, isAuthenticated]);

  // Base nav items (always visible)
  const baseNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
  ];

  // Auth-only nav items
  const authNavItems = [
    { href: '/me/library', label: 'Library', icon: BookOpen },
    // Link directly to public profile for "Profile" since it's the public view
    // Or we could have /me/profile page that acts as a dashboard?
    // User asked for /me/profile. Let's make it consistent. 
    // But for now, let's link to the dynamic profile URL as that's what exists.
    // Actually, let's use /me/settings for "Profile" management?
    // No, standard is Profile -> Public View.
    { href: user?.profiles?.username ? `/@${user.profiles.username}` : '/me/settings', label: 'Profile', icon: UserIcon },
  ];

  const navItems = isAuthenticated 
    ? [...baseNavItems, ...authNavItems]
    : baseNavItems;
    
  // Add Settings icon import if needed.
  // Wait, I need to add Settings to imports.

  return (
    <aside className="flex flex-col h-full p-6">
      {/* Main Navigation */}
      <nav className="space-y-1 mb-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'text-foreground font-medium bg-accent/5'
                  : 'text-muted hover:text-foreground hover:bg-accent/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Following List (Authenticated) */}
      {isAuthenticated && (
        <div className="mb-8">
          <button 
            onClick={() => setIsFollowingExpanded(!isFollowingExpanded)}
            className="flex items-center justify-between w-full px-3 text-sm font-bold text-foreground mb-2 hover:text-accent transition-colors"
          >
            <span>Following</span>
            {isFollowingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isFollowingExpanded && (
            <div className="space-y-1">
              {following.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted">
                  You are not following anyone
                </div>
              ) : (
                <>
                  {following.map((followedUser) => {
                     const name = followedUser.profiles?.display_name || followedUser.profiles?.username || 'User';
                     const username = followedUser.profiles?.username;
                     return (
                       <Link
                         key={followedUser.id}
                         href={`/@${username}`}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent/5 transition-colors group"
                       >
                         <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {followedUser.profiles?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={followedUser.profiles.avatar_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] font-medium text-accent">{name[0]?.toUpperCase()}</span>
                            )}
                         </div>
                         <span className="text-sm text-muted group-hover:text-foreground truncate">{name}</span>
                       </Link>
                     );
                  })}
                  <Link href="/me/following" className="block px-3 py-1.5 text-xs text-accent hover:underline mt-1">
                    View all
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
