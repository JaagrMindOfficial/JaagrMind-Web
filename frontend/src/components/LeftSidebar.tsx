'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  BookOpen, 
  User, 
  Compass
} from 'lucide-react';

export function LeftSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Base nav items (always visible)
  const baseNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
  ];

  // Auth-only nav items
  const authNavItems = [
    { href: '/library', label: 'Library', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const navItems = isAuthenticated 
    ? [...baseNavItems, ...authNavItems]
    : baseNavItems;

  return (
    <aside className="flex flex-col h-[calc(100vh-56px)] sticky top-14 p-6 overflow-y-auto">
      {/* Main Navigation */}
      <nav className="space-y-1 mb-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'text-foreground font-medium'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Recommended Topics - Always visible */}
      <div className="flex-1">
        <h3 className="px-3 text-sm font-medium text-foreground mb-3">Recommended Topics</h3>
        <div className="flex flex-wrap gap-2 px-3">
          {['Education', 'Psychology', 'Parenting', 'Technology', 'Self Improvement', 'Science'].map((topic) => (
            <Link
              key={topic}
              href={`/topic/${topic.toLowerCase().replace(' ', '-')}`}
              className="px-3 py-1.5 bg-input rounded-full text-xs text-muted hover:text-foreground transition-colors"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>

      {/* Auth prompt for unauthenticated users */}
      {!isAuthenticated && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="px-3 text-sm text-muted mb-3">
            Sign in to follow your favorite writers and save articles to your library.
          </p>
          <Link
            href="/login"
            className="block px-3 py-2 text-sm text-center bg-accent text-white rounded-full hover:bg-accent/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      )}

      {/* Following info for authenticated users */}
      {isAuthenticated && user && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="px-3 text-xs text-muted">
            Signed in as @{user.profiles?.username || user.email}
          </p>
        </div>
      )}
    </aside>
  );
}
