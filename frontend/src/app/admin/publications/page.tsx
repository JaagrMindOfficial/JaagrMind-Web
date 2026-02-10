'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, BookOpen, Image as ImageIcon } from 'lucide-react';
import { MediaPicker } from '@/components/MediaPicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Publication {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Publication>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublications();
  }, []);

  async function fetchPublications() {
    try {
      const res = await fetch(`${API_URL}/publications`);
      if (res.ok) {
        const data = await res.json();
        setPublications(data.data || data); // Handle both formats if API varies
      }
    } catch (err) {
      console.error('Failed to fetch publications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.name?.trim() || !formData.slug?.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/publications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setPublications([...publications, data.data]);
        setIsCreating(false);
        setFormData({});
        setError('');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create publication');
      }
    } catch (err) {
      setError('Failed to create publication');
    }
  }

  async function handleUpdate() {
    if (!editingId || !formData.name?.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/publications/${editingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setPublications(publications.map(p => 
          p.id === editingId ? { ...p, ...formData } : p
        ));
        setEditingId(null);
        setFormData({});
        setError('');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update publication');
      }
    } catch (err) {
      setError('Failed to update publication');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this publication?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/publications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setPublications(publications.filter(p => p.id !== id));
      }
    } catch (err) {
      setError('Failed to delete publication');
    }
  }

  function startEdit(pub: Publication) {
    setEditingId(pub.id);
    setFormData({
      name: pub.name,
      slug: pub.slug,
      description: pub.description,
      logo_url: pub.logo_url,
      cover_url: pub.cover_url,
    });
    setIsCreating(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Publications</h1>
          <p className="text-muted">Manage publications</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => {
              setIsCreating(true);
              setFormData({});
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Publication
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form (Create/Edit) */}
      {(isCreating || editingId) && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-4">{isCreating ? 'New Publication' : 'Edit Publication'}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => {
                     const name = e.target.value;
                     setFormData(prev => ({ 
                       ...prev, 
                       name,
                       slug: isCreating ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : prev.slug 
                     }));
                  }}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <div className="flex items-center gap-4">
                  {formData.logo_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={formData.logo_url} alt="Logo" className="w-12 h-12 rounded bg-muted object-cover" />
                  )}
                  <MediaPicker
                    onSelect={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                    trigger={
                      <button className="px-3 py-1.5 bg-accent/10 text-accent rounded hover:bg-accent/20 text-sm">
                        Select Logo
                      </button>
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cover Image</label>
                <div className="flex items-center gap-4">
                   {formData.cover_url && (
                     /* eslint-disable-next-line @next/next/no-img-element */
                     <img src={formData.cover_url} alt="Cover" className="w-20 h-12 rounded bg-muted object-cover" />
                   )}
                   <MediaPicker
                     onSelect={(url) => setFormData(prev => ({ ...prev, cover_url: url }))}
                     trigger={
                       <button className="px-3 py-1.5 bg-accent/10 text-accent rounded hover:bg-accent/20 text-sm">
                         Select Cover
                       </button>
                     }
                   />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setFormData({});
                }}
                className="px-4 py-2 hover:bg-accent/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isCreating ? handleCreate : handleUpdate}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                {isCreating ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid gap-4">
        {loading ? (
           <div className="text-center py-8 text-muted">Loading...</div>
        ) : publications.length === 0 ? (
           <div className="text-center py-8 bg-card border border-border rounded-lg">
             <BookOpen className="w-12 h-12 text-muted mx-auto mb-2 opacity-50" />
             <p>No publications found</p>
           </div>
        ) : (
          publications.map((pub) => (
            <div key={pub.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-accent/50 transition-colors">
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                {pub.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={pub.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{pub.name}</h3>
                <p className="text-sm text-muted truncate">/{pub.slug}</p>
                {pub.description && (
                  <p className="text-sm text-muted-foreground truncate opacity-70">{pub.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(pub)}
                  className="p-2 hover:bg-accent/10 text-accent rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(pub.id)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
