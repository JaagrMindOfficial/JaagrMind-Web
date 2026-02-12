'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MultiSelect } from '@/components/MultiSelect';
import { MediaPicker } from '@/components/MediaPicker';
import { Editor } from '@/components/editor/Editor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function NewPostPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [post, setPost] = useState({
    title: '',
    subtitle: '',
    slug: '',
    content: '',
    cover_url: '',
    status: 'draft',
    topic_ids: [] as string[],
  });

  const [topics, setTopics] = useState<{ value: string; label: string; parentId?: string }[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Fetch topics
  useEffect(() => {
    fetch(`${API_URL}/topics`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTopics(data.data.map((t: any) => ({ value: t.id, label: t.name, parentId: t.parent_id })));
        }
      })
      .catch(err => console.error('Failed to fetch topics', err));
  }, []);

  // Auto-generate slug from title
  function handleTitleChange(title: string) {
    setPost(prev => ({
      ...prev,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    }));
  }

  async function handleSave(publish = false) {
    if (!post.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      
      // Use the content directly from Tiptap (it's already in JSON format from onChange)
      // The backend expects an array of blocks, so we extract .content from the doc
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentBlocks = (post.content as any)?.content || [];

      const res = await fetch(`${API_URL}/admin/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          content: contentBlocks,
          status: publish ? 'published' : 'draft',
          topicIds: selectedTopics, // CamelCase for backend
          coverUrl: post.cover_url, // CamelCase for backend (mapping from state)
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save post');
      }

      const data = await res.json();
      router.push(`/admin/posts/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-xl font-bold">New Post</h1>
            <p className="text-sm text-muted">Create new content</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-border/50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center justify-between">
          {error}
          <button type="button" onClick={() => setError('')}>
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

        {/* Topics & Sub-topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Root Topics */}
          <div>
            <MultiSelect
              label="Topics"
              options={topics.filter(t => !t.parentId)}
              value={selectedTopics.filter(id => topics.find(t => t.value === id && !t.parentId))}
              onChange={(selectedRoots) => {
                const currentSubIds = selectedTopics.filter(id => topics.find(t => t.value === id && t.parentId));
                const validSubIds = currentSubIds.filter(subId => {
                   const subTopic = topics.find(t => t.value === subId);
                   return subTopic && subTopic.parentId && selectedRoots.includes(subTopic.parentId);
                });
                setSelectedTopics([...selectedRoots, ...validSubIds]);
              }}
              placeholder="Select topics..."
            />
          </div>

          {/* Sub-topics */}
          <div>
            <MultiSelect
              label="Sub-topics"
              options={topics.filter(t => {
                const rootIds = selectedTopics.filter(id => topics.find(r => r.value === id && !r.parentId));
                return t.parentId && rootIds.includes(t.parentId);
              })}
              value={selectedTopics.filter(id => topics.find(t => t.value === id && t.parentId))}
              onChange={(selectedSubs) => {
                const currentRootIds = selectedTopics.filter(id => topics.find(t => t.value === id && !t.parentId));
                setSelectedTopics([...currentRootIds, ...selectedSubs]);
              }}
              placeholder={
                selectedTopics.some(id => topics.find(t => t.value === id && !t.parentId))
                  ? "Select sub-topics..."
                  : "Select a topic first"
              }
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Post title..."
            value={post.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-3xl font-bold bg-transparent border-0 focus:outline-none placeholder:text-muted/50"
          />
        </div>

        {/* Subtitle */}
        <div>
          <input
            type="text"
            placeholder="Add a subtitle..."
            value={post.subtitle}
            onChange={(e) => setPost(prev => ({ ...prev, subtitle: e.target.value }))}
            className="w-full text-lg text-muted bg-transparent border-0 focus:outline-none placeholder:text-muted/50"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-1">URL Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">
              {loading ? '/@.../' : `/@${user?.profiles?.username || user?.email?.split('@')[0] || 'username'}/`}
            </span>
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

