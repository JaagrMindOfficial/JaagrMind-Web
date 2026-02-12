'use client';

// ... imports
import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tags, ChevronRight, Layers } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Topic {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
  parent_id?: string | null;
  level?: number;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Root Topic State
  const [newTopicName, setNewTopicName] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Sub-topic Modal State
  const [selectedParent, setSelectedParent] = useState<Topic | null>(null);
  const [newSubTopicName, setNewSubTopicName] = useState('');

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

  async function handleCreate(name: string, parentId?: string | null) {
    if (!name.trim()) return false;

    try {
      const token = localStorage.getItem('accessToken');
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      const res = await fetch(`${API_URL}/admin/topics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          slug,
          parentId: parentId || null 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTopics([...topics, data.data]);
        return true;
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create topic');
        return false;
      }
    } catch {
      setError('Failed to create topic');
      return false;
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
        body: JSON.stringify({ 
            name: editingName, 
            slug,
            parentId: topic.parent_id // Keep existing parent
        }),
      });

      if (res.ok) {
        const updatedTopic = await res.json();
        setTopics(topics.map(t => 
          t.id === topic.id ? updatedTopic.data : t
        ));
        setEditingId(null);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update topic');
      }
    } catch {
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
    } catch {
      setError('Failed to delete topic');
    }
  }

  const rootTopics = topics.filter(t => !t.parent_id);
  const getSubTopics = (parentId: string) => topics.filter(t => t.parent_id === parentId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Topics</h1>
          <p className="text-muted">Manage root topics and their sub-topics</p>
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

      {/* Create New Root Topic */}
      <div className="bg-input rounded-lg border border-border p-4 mb-6">
        <h2 className="font-semibold mb-3">Add Root Topic</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Topic name..."
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                    if (await handleCreate(newTopicName)) {
                        setNewTopicName('');
                    }
                }
            }}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={async () => {
                if (await handleCreate(newTopicName)) {
                    setNewTopicName('');
                }
            }}
            disabled={!newTopicName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Root Topics List */}
      <div className="bg-input rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
            <p className="text-muted mt-2">Loading topics...</p>
          </div>
        ) : rootTopics.length === 0 ? (
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
                <th className="px-4 py-3 font-medium">Sub-topics</th>
                <th className="px-4 py-3 font-medium">Posts</th>
                <th className="px-4 py-3 font-medium w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rootTopics.map((topic) => {
                 const subCount = getSubTopics(topic.id).length;
                 return (
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
                    <td className="px-4 py-3 text-sm">
                        <span 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-full text-xs cursor-pointer hover:bg-accent/20"
                            onClick={() => setSelectedParent(topic)}
                        >
                            <Layers className="w-3 h-3" />
                            {subCount} sub-topics
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                        {topic.post_count || 0}
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
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
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setSelectedParent(topic)}
                                className="p-1 hover:bg-border rounded"
                                title="Manage Subbox"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(topic.id)}
                                className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            </>
                        )}
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sub-topics Modal */}
      {selectedParent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold">Sub-topics for "{selectedParent.name}"</h2>
                        <p className="text-sm text-muted">Manage categories under this topic</p>
                    </div>
                    <button onClick={() => setSelectedParent(null)} className="p-1 hover:bg-border rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 border-b border-border bg-input/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="New sub-topic name..."
                            value={newSubTopicName}
                            onChange={(e) => setNewSubTopicName(e.target.value)}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    if(await handleCreate(newSubTopicName, selectedParent.id)) {
                                        setNewSubTopicName('');
                                    }
                                }
                            }}
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button
                            onClick={async () => {
                                if(await handleCreate(newSubTopicName, selectedParent.id)) {
                                    setNewSubTopicName('');
                                }
                            }}
                            disabled={!newSubTopicName.trim()}
                            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm font-medium"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                    {getSubTopics(selectedParent.id).length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No sub-topics yet</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {getSubTopics(selectedParent.id).map(sub => (
                                <div key={sub.id} className="flex items-center justify-between p-3 hover:bg-border/20 rounded-lg group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                        <span>{sub.name}</span>
                                        <span className="text-xs text-muted">/{sub.slug}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-red-500 rounded transition-all"
                                        title="Delete sub-topic"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
