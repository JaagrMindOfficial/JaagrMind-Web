'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MultiSelect } from '@/components/MultiSelect';
import { MediaPicker } from '@/components/MediaPicker';
import { Editor } from '@/components/editor/Editor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  cover_url: string;
  status: 'draft' | 'published' | 'archived';
  topic_ids: string[];
  author?: {
    profiles?: {
      username: string;
    };
  };
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [post, setPost] = useState<Post>({
    id: '',
    title: '',
    subtitle: '',
    slug: '',
    content: [],
    cover_url: '',
    status: 'draft',
    topic_ids: [],
  });

  const [topics, setTopics] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchPost();
    fetchTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function fetchTopics() {
    fetch(`${API_URL}/topics`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTopics(data.data.map((t: any) => ({ value: t.id, label: t.name })));
        }
      })
      .catch(err => console.error('Failed to fetch topics', err));
  }

  const fetchPost = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/posts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Post not found');

      const data = await res.json();
      
      setPost({
        ...data.data,
        topic_ids: data.data.topics?.map((t: { id: string }) => t.id) || [],
      });
      
      if (data.data.content) {
        setPost(prev => ({
          ...prev,
          // Wrap backend content array in Tiptap doc structure
          content: {
            type: 'doc',
            content: data.data.content
          }
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function handleSave(newStatus?: 'draft' | 'published') {
    if (!post.title.trim()) {
      setError('Title is required');
      return;
    }

    // Optimistic UI updates
    setSaving(true);
    setMessage(newStatus === 'published' ? 'Post published!' : (newStatus === 'draft' ? 'Post unpublished!' : 'Post saved!'));
    setError('');

    // Capture previous status for rollback
    const previousStatus = post.status;
    
    // Optimistically update status
    if (newStatus) {
        setPost(prev => ({ ...prev, status: newStatus }));
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      // Extract content array from Tiptap doc
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentBlocks = (post.content as any)?.content || [];

      const res = await fetch(`${API_URL}/admin/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: post.title,
          subtitle: post.subtitle,
          slug: post.slug,
          content: contentBlocks,
          coverUrl: post.cover_url, // CamelCase
          status: newStatus || post.status,
          topicIds: post.topic_ids, // CamelCase
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save post');
      }

      // Success - keeps the optimistic state
    } catch (err) {
      console.error(err);
      // Rollback status
      if (newStatus) {
         setPost(prev => ({ ...prev, status: previousStatus }));
      }
      setMessage('');
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
      // Clear message after delay
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        router.push('/admin/posts');
      }
    } catch (err) {
      setError('Failed to delete post');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/posts"
            className="p-2 hover:bg-border rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Edit Post</h1>
            <p className="text-sm text-muted">
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                post.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {post.status}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-border/50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          {post.status === 'published' ? (
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4" />
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              Publish
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm flex items-center justify-between">
          {message}
          <button onClick={() => setMessage('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Form */}
      <div className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          {post.cover_url ? (
            <div className="relative rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={post.cover_url} 
                alt="Cover" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <MediaPicker
                  onSelect={(url) => setPost(prev => ({ ...prev, cover_url: url }))}
                  trigger={
                    <button
                      type="button"
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
                    >
                      Change
                    </button>
                  }
                />
                <button
                  type="button"
                  onClick={() => setPost(prev => ({ ...prev, cover_url: '' }))}
                  className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <MediaPicker
              onSelect={(url) => setPost(prev => ({ ...prev, cover_url: url }))}
              trigger={
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors group">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-accent" />
                  </div>
                  <p className="font-medium mb-1">Select cover image</p>
                  <p className="text-sm text-muted">Choose from Media Library</p>
                </div>
              }
            />
          )}
        </div>

        {/* Topics */}
        <div className="mb-6">
          <MultiSelect
            label="Topics"
            options={topics}
            value={post.topic_ids || []}
            onChange={(selected) => setPost(prev => ({ ...prev, topic_ids: selected }))}
            placeholder="Select topics..."
          />
        </div>

        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Post title..."
            value={post.title}
            onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
            className="w-full text-3xl font-bold bg-transparent border-0 focus:outline-none placeholder:text-muted/50"
          />
        </div>

        {/* Subtitle */}
        <div>
          <input
            type="text"
            placeholder="Add a subtitle..."
            value={post.subtitle || ''}
            onChange={(e) => setPost(prev => ({ ...prev, subtitle: e.target.value }))}
            className="w-full text-lg text-muted bg-transparent border-0 focus:outline-none placeholder:text-muted/50"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-1">URL Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">/@{post.author?.profiles?.username || user?.profiles?.username || 'username'}/</span>
            <input
              type="text"
              value={post.slug}
              onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
              className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

      {/* Content */}
        <div className="min-h-[500px]">
          <label className="block text-sm font-medium mb-2">Content</label>
          <div className="border border-border rounded-lg min-h-[400px] bg-background">
             <Editor 
               content={post.content} 
               onChange={(html, json) => {
                 // We settle on saving the JSON structure
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 setPost(prev => ({ ...prev, content: json as any }));
               }}
               placeholder="Write your story..."
             />
          </div>
        </div>
      </div>
    </div>
  );
}
