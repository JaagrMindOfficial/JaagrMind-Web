'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  Users, 
  Settings,
  ChevronLeft,
  LogOut,
  Image as ImageIcon,
  BookOpen
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/topics', label: 'Topics', icon: Tags },
  { href: '/admin/publications', label: 'Publications', icon: BookOpen },
  { href: '/admin/users', label: 'Users', icon: Users, minRole: 'admin' },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const roleHierarchy: Record<string, number> = {
  admin: 4,
  editor: 3,
  author: 2,
  reader: 1,
};

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // Check if user has required role (author+)
  const userRole = user?.role || 'reader';
  const hasAccess = roleHierarchy[userRole] >= roleHierarchy['author'];

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted mb-4">You need author permissions to access the CMS.</p>
          <Link 
            href="/"
            className="text-accent hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo variant="mini" height={28} />
            <span className="font-semibold">CMS</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems
            .filter(item => {
              if (!item.minRole) return true;
              return roleHierarchy[userRole] >= roleHierarchy[item.minRole];
            })
            .map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-muted hover:text-foreground hover:bg-accent/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
              {user?.profiles?.display_name?.[0] || user?.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.profiles?.display_name || user?.email}
              </p>
              <p className="text-xs text-muted capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors border border-border rounded"
            >
              <ChevronLeft className="w-3 h-3" />
              Back to site
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors border border-border rounded"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-border">
          <div></div>
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
