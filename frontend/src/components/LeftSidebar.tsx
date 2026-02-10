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
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getFollowing, User } from '@/lib/api';

export function LeftSidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [following, setFollowing] = useState<User[]>([]);
  const [isFollowingExpanded, setIsFollowingExpanded] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      getFollowing(1, 5).then((res) => {
        if (res.data) setFollowing(res.data);
      });
    }
  }, [isAuthenticated]);

  // Base nav items (always visible)
  const baseNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
  ];

  // Auth-only nav items
  const authNavItems = [
    { href: '/library', label: 'Library', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const navItems = isAuthenticated 
    ? [...baseNavItems, ...authNavItems]
    : baseNavItems;

  return (
    <aside className="flex flex-col h-[calc(100vh-56px)] sticky top-14 p-6 overflow-y-auto w-64">
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
      {isAuthenticated && following.length > 0 && (
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
                          <img src={followedUser.profiles.avatar_url} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-medium text-accent">{name[0]?.toUpperCase()}</span>
                        )}
                     </div>
                     <span className="text-sm text-muted group-hover:text-foreground truncate">{name}</span>
                   </Link>
                 );
              })}
              <Link href="/following" className="block px-3 py-1.5 text-xs text-accent hover:underline mt-1">
                View all
              </Link>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
