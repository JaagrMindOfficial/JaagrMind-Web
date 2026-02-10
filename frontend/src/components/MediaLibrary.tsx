'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Search, Image as ImageIcon, Trash2, Check } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Media {
  id: string;
  url: string;
  filename: string;
  alt_text?: string;
  tags?: string[];
  created_at: string;
}

interface MediaLibraryProps {
  onSelect?: (media: Media) => void;
  selectionMode?: boolean;
}

export function MediaLibrary({ onSelect, selectionMode = false }: MediaLibraryProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia(search?: string) {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let url = `${API_URL}/admin/media?page=1&pageSize=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    // Optional: Add tags/alt text input before upload
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (res.ok) {
        fetchMedia(); // Refresh list
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMedia(prev => prev.filter(m => m.id !== id));
        if (selectedMedia?.id === id) setSelectedMedia(null);
      } else {
        alert('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  return (
    <div className="bg-background border border-border rounded-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search media..."
            className="w-full pl-9 pr-4 py-2 bg-accent/5 border-none rounded-md text-sm focus:ring-1 focus:ring-accent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Debounce could be added here
              if (e.target.value.length > 2 || e.target.value === '') {
                fetchMedia(e.target.value);
              }
            }}
          />
        </div>
        <div>
          <label className={`
            flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md cursor-pointer hover:bg-foreground/90 transition-colors text-sm font-medium
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}>
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted text-sm">Loading media...</div>
        ) : media.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted">
            <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No media found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div 
                key={item.id}
                className={`
                  group relative aspect-square bg-accent/5 rounded-md overflow-hidden border cursor-pointer transition-all
                  ${selectedMedia?.id === item.id ? 'ring-2 ring-accent border-transparent' : 'border-border hover:border-accent/50'}
                `}
                onClick={() => {
                  setSelectedMedia(item);
                  if (selectionMode && onSelect) {
                    onSelect(item);
                  }
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.url} 
                  alt={item.alt_text || item.filename}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay actions (Admin mode only) */}
                {!selectionMode && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Copy URL
                        navigator.clipboard.writeText(item.url);
                        alert('URL copied!');
                      }}
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm"
                      title="Copy URL"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Selection Indicator */}
                {selectedMedia?.id === item.id && selectionMode && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Selection Details */}
      {!selectionMode && selectedMedia && (
        <div className="p-4 border-t border-border bg-accent/5 text-xs">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-border rounded overflow-hidden flex-shrink-0">
               {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedMedia.url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-medium truncate">{selectedMedia.filename}</p>
              <p className="text-muted truncate select-all">{selectedMedia.url}</p>
              <p className="text-muted">{new Date(selectedMedia.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
