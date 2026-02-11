'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  X, 
  Trash2, 
  EyeOff, 
  Eye, 
  BarChart2, 
  Clock,
  ExternalLink,
  Edit,
  MessageCircle,
  Activity
} from 'lucide-react';
import { Clap } from '@/components/icons/Clap';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { apiFetch, Post } from '@/lib/api';
import { CommentManager } from './CommentManager';

interface PostStatsModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface StatsData {
  totalViews: number;
  totalClaps: number;
  totalComments: number;
  readingTime?: number;
  dailyStats:Array<{ date: string; views: number; claps: number }>;
}

export function PostStatsModal({ post, isOpen, onClose, onUpdate }: PostStatsModalProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'comments'>('stats');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<StatsData>(`/posts/${post.id}/stats`);
        if (res.success && res.data) {
            setStats(res.data);
        }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (isOpen && post.id) {
      fetchStats();
    }
  }, [isOpen, post.id, fetchStats]);

  async function handleUnpublish() {
    if (!confirm('Are you sure you want to unpublish this post?')) return;
    
    setActionLoading(true);
    try {
      await apiFetch(`/admin/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'draft' }),
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to unpublish:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      await apiFetch(`/admin/posts/${post.id}`, {
        method: 'DELETE',
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setActionLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold font-serif line-clamp-1">{post.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                post.status === 'published' 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-yellow-500/10 text-yellow-600'
              }`}>
                {post.status}
              </span>
              <span>•</span>
              <span>Published on {format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Post */}
            <Link 
              href={`/@${post.author?.profiles?.username || 'user'}/${post.slug}`}
              target="_blank"
              className="p-2 hover:bg-accent/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              title="View Post"
            >
              <ExternalLink className="w-5 h-5" />
            </Link>

            {/* Edit Post */}
            <Link 
              href={`/admin/posts/${post.id}`}
              className="p-2 hover:bg-accent/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              title="Edit Post"
            >
              <Edit className="w-5 h-5" />
            </Link>

            {/* Unpublish */}
            {post.status === 'published' && (
              <button
                onClick={handleUnpublish}
                disabled={actionLoading}
                className="p-2 hover:bg-accent/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                title="Unpublish Post"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            )}

            {/* Delete */}
            <button
               onClick={handleDelete}
               disabled={actionLoading}
               className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500"
               title="Delete Post"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-border mx-2" />

            <button 
              onClick={onClose}
              className="p-2 hover:bg-accent/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-border shrink-0">
            <button
                onClick={() => setActiveTab('stats')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'stats' 
                        ? 'border-foreground text-foreground' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
                Stats
            </button>
            <button
                onClick={() => setActiveTab('comments')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'comments' 
                        ? 'border-foreground text-foreground' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
                Comments
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'stats' ? (
                 <div className="h-full flex flex-col p-6 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Eye className="w-5 h-5" />
                                <span className="text-sm font-medium">Total Views</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {loading ? '...' : stats?.totalViews}
                            </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Clap className="w-5 h-5" />
                                <span className="text-sm font-medium">Total Claps</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {loading ? '...' : stats?.totalClaps}
                            </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Total Comments</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {loading ? '...' : stats?.totalComments}
                            </div>
                        </div>
                         <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Activity className="w-5 h-5" />
                                <span className="text-sm font-medium">Engagement Rate</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {loading ? '...' : (
                                    ((stats?.totalClaps || 0) + (stats?.totalComments || 0)) / (stats?.totalViews || 1) * 100
                                ).toFixed(1)}%
                            </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border border-border col-span-2 md:col-span-1 lg:col-span-1">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Clock className="w-5 h-5" />
                                <span className="text-sm font-medium">Est. Read Time</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {post.reading_time} <span className="text-sm font-normal text-muted-foreground">min</span>
                            </div>
                        </div>
                    </div>

                     {/* Graph */}
                     <div className="flex-1 bg-card border border-border rounded-xl p-6 min-h-0 flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 shrink-0">
                            <BarChart2 className="w-5 h-5 text-accent" />
                            30-Day Performance
                        </h3>
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                Loading stats...
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats?.dailyStats || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{fontSize: 12, fill: '#6b7280'}}
                                            tickFormatter={(val) => format(new Date(val), 'MMM d')}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            tick={{fontSize: 12, fill: '#6b7280'}}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                            labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="views" 
                                            stroke="#2563eb" 
                                            strokeWidth={3} 
                                            dot={false} 
                                            activeDot={{r: 6}} 
                                            name="Views"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="claps" 
                                            stroke="#16a34a" 
                                            strokeWidth={3} 
                                            dot={false} 
                                            activeDot={{r: 6}} 
                                            name="Claps"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                     </div>
                 </div>
            ) : (
                <div className="h-full overflow-y-auto p-6">
                    <CommentManager postId={post.id} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
