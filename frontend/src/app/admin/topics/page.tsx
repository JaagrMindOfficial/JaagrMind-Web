'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tags } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Topic {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  async function fetchTopics() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/topics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setTopics(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTopicName.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const slug = newTopicName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      const res = await fetch(`${API_URL}/admin/topics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTopicName, slug }),
      });

      if (res.ok) {
        const data = await res.json();
        setTopics([...topics, data.data]);
        setNewTopicName('');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create topic');
      }
    } catch (err) {
      setError('Failed to create topic');
    }
  }

  async function handleUpdate(topic: Topic) {
    if (!editingName.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const slug = editingName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      const res = await fetch(`${API_URL}/admin/topics/${topic.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName, slug }),
      });

      if (res.ok) {
        setTopics(topics.map(t => 
          t.id === topic.id ? { ...t, name: editingName, slug } : t
        ));
        setEditingId(null);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update topic');
      }
    } catch (err) {
      setError('Failed to update topic');
    }
  }

  async function handleDelete(topicId: string) {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setTopics(topics.filter(t => t.id !== topicId));
      }
    } catch (err) {
      setError('Failed to delete topic');
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Topics</h1>
          <p className="text-muted">Organize your content with topics</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create New Topic */}
      <div className="bg-input rounded-lg border border-border p-4 mb-6">
        <h2 className="font-semibold mb-3">Add New Topic</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Topic name..."
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleCreate}
            disabled={!newTopicName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-input rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
            <p className="text-muted mt-2">Loading topics...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center">
            <Tags className="w-12 h-12 text-muted mx-auto mb-2" />
            <p className="text-muted">No topics yet</p>
            <p className="text-sm text-muted">Create your first topic above</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-border/30">
              <tr className="text-left text-sm text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Posts</th>
                <th className="px-4 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topics.map((topic) => (
                <tr key={topic.id} className="hover:bg-border/20">
                  <td className="px-4 py-3">
                    {editingId === topic.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(topic)}
                        className="px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{topic.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    /{topic.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {topic.post_count || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {editingId === topic.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(topic)}
                            className="p-1 hover:bg-green-500/10 text-green-500 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:bg-border rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(topic.id);
                              setEditingName(topic.name);
                            }}
                            className="p-1 hover:bg-border rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(topic.id)}
                            className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
