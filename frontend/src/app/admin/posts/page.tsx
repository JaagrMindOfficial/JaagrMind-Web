'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Filter,
  BarChart2,
  ArrowUpDown
} from 'lucide-react';
import { PostStatsModal } from '@/components/dashboard/PostStatsModal';
import { Post } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PostsListPage() {
  useAuth(); // Keep hook call for auth check
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'view_count' | 'clap_count'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const params = new URLSearchParams({
        page: '1',
        pageSize: '50', // Fetch more to make client search useful
        sortBy,
        sortDir
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`${API_URL}/admin/posts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ... (handleDelete, handleTogglePublish remain same)
  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }

  async function handleTogglePublish(post: Post) {
    try {
      const token = localStorage.getItem('accessToken');
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      
      const res = await fetch(`${API_URL}/admin/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null }
            : p
        ));
      }
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  }

  const filteredPosts = posts.filter(post => {
    const searchLower = search.toLowerCase();
    const matchesTitle = post.title.toLowerCase().includes(searchLower);
    const matchesAuthor = post.author?.profiles?.display_name?.toLowerCase().includes(searchLower) || 
                          post.author?.email?.toLowerCase().includes(searchLower);
    return matchesTitle || matchesAuthor;
  });

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-500/10 text-yellow-500',
    published: 'bg-green-500/10 text-green-500',
    archived: 'bg-gray-500/10 text-gray-500',
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc'); // Default to desc for new field
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return <div className="w-4 h-4 opacity-0" />; // Spacer
    return <ArrowUpDown className={`w-3 h-3 ml-1 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-muted">Manage your content</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search posts or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-input rounded-lg border border-border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
            <p className="text-muted mt-2">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted mb-4">No posts found</p>
            <Link
              href="/admin/posts/new"
              className="text-accent hover:underline"
            >
              Create your first post
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-border/30">
              <tr className="text-left text-sm text-muted">
                <th className="px-4 py-3 font-medium first:rounded-tl-lg cursor-pointer hover:bg-border/50" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center">Title <SortIcon field="created_at" /></div> {/* Actually SortIcon logic above is generic, here reusing for Title to just show created_at sort or maybe add title sort support? Backend doesn't support title sort. Let's keep title unsortable or sort created_at */}
                </th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-border/50" onClick={() => handleSort('view_count')}>
                  <div className="flex items-center">Views <SortIcon field="view_count" /></div>
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-border/50" onClick={() => handleSort('clap_count')}>
                  <div className="flex items-center">Claps <SortIcon field="clap_count" /></div>
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-border/50" onClick={() => handleSort('created_at')}>
                   <div className="flex items-center">Created <SortIcon field="created_at" /></div>
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-border/50" onClick={() => handleSort('updated_at')}>
                   <div className="flex items-center">Updated <SortIcon field="updated_at" /></div>
                </th>
                <th className="px-4 py-3 font-medium w-16 last:rounded-tr-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPosts.map((post) => (
                <tr 
                    key={post.id} 
                    className="hover:bg-border/20 cursor-pointer group last:first:rounded-bl-lg last:last:rounded-br-lg"
                    onClick={() => setSelectedPost(post)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium group-hover:text-accent transition-colors">
                      {post.title || 'Untitled'}
                    </span>
                    <p className="text-xs text-muted truncate max-w-xs">
                      /{post.slug || 'no-slug'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                     <div className="flex items-center gap-2">
                        {post.author?.profiles?.avatar_url ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={post.author.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent font-bold">
                                {post.author?.profiles?.display_name?.[0] || post.author?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <span className="text-sm">{post.author?.profiles?.display_name || 'Unknown'}</span>
                     </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${statusColors[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {post.view_count?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {post.clap_count?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {format(new Date(post.updated_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                      className="p-1 hover:bg-border rounded"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    {menuOpen === post.id && (
                      <div className="absolute right-4 top-full mt-1 w-40 bg-background border border-border rounded-lg shadow-lg z-10">
                        {/* View Stats Option */}
                        <button
                          onClick={() => {
                              setSelectedPost(post);
                              setMenuOpen(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-border/50 w-full text-left"
                        >
                          <BarChart2 className="w-4 h-4" />
                          View Stats
                        </button>

                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-border/50"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-border/50 w-full text-left"
                        >
                          {post.status === 'published' ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Publish
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 w-full text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Modal */}
      {selectedPost && (
        <PostStatsModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdate={fetchPosts}
        />
      )}
    </div>
  );
}
