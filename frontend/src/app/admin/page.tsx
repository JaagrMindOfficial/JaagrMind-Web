'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Eye, Heart, TrendingUp, Plus } from 'lucide-react';

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalClaps: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalClaps: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual stats from API
    // For now, show placeholder data
    setStats({
      totalPosts: 12,
      publishedPosts: 8,
      draftPosts: 4,
      totalViews: 1234,
      totalClaps: 567,
    });
    setLoading(false);
  }, []);

  const statCards = [
    { 
      label: 'Total Posts', 
      value: stats.totalPosts, 
      icon: FileText, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Published', 
      value: stats.publishedPosts, 
      icon: TrendingUp, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Drafts', 
      value: stats.draftPosts, 
      icon: FileText, 
      color: 'bg-orange-500' 
    },
    { 
      label: 'Total Views', 
      value: stats.totalViews.toLocaleString(), 
      icon: Eye, 
      color: 'bg-purple-500' 
    },
    { 
      label: 'Total Claps', 
      value: stats.totalClaps.toLocaleString(), 
      icon: Heart, 
      color: 'bg-pink-500' 
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted">
            Welcome back, {user?.profiles?.display_name || user?.email}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-input rounded-lg p-4 animate-pulse">
              <div className="h-8 bg-border rounded mb-2" />
              <div className="h-4 bg-border rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => (
            <div 
              key={stat.label}
              className="bg-input rounded-lg p-4 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-input rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Posts</h2>
            <Link href="/admin/posts" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              No posts yet. Create your first post!
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-input rounded-lg border border-border p-4">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/posts/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-border/50 transition-colors"
            >
              <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Create New Post</p>
                <p className="text-xs text-muted">Write and publish content</p>
              </div>
            </Link>
            <Link
              href="/admin/topics"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-border/50 transition-colors"
            >
              <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Manage Topics</p>
                <p className="text-xs text-muted">Organize your content</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
