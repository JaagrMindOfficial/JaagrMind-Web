'use client';

// Header component
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Search, LogIn, UserPlus } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex h-14">
        {/* Left: Logo Area */}
        <div className="flex items-center lg:w-64 border-r border-border shrink-0 px-9">
          <Link href="/" className="flex-shrink-0">
            <Logo variant="full" height={28} />
          </Link>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex-1 flex items-center justify-between px-4 sm:px-6">
          {/* Search - Desktop */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-input rounded-full">
            <Search className="w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none outline-none text-sm w-40 placeholder:text-muted"
            />
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search - Mobile */}
            <button className="sm:hidden p-2 hover:bg-accent/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-muted" />
            </button>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Auth-based UI */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              /* Authenticated User Menu */
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium overflow-hidden"
                >
                  {user.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={user.profiles.avatar_url} 
                      alt={user.profiles.display_name || ''} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.profiles?.display_name?.[0] || user.email[0].toUpperCase()}</span>
                  )}
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium truncate">{user.profiles?.display_name || user.email}</p>
                      <p className="text-xs text-muted truncate">@{user.profiles?.username}</p>
                    </div>
                    <Link 
                      href="/me/library" 
                      className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      Library
                    </Link>
                    <Link 
                      href={`/@${user.profiles?.username || user.email.split('@')[0]}`} 
                      className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      href="/me/settings" 
                      className="block px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      Settings
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-accent/10 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Anonymous User - Sign In / Sign Up */
              <div className="flex items-center gap-2">
                <Link 
                  href="/login"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Link>
                <Link 
                  href="/signup"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-accent text-white rounded-full hover:bg-accent/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">Get started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
