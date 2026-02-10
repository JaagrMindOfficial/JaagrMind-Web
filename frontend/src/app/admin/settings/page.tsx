'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { apiFetch } from '@/lib/api';
import { Save, User, Palette, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth(); // simplistic way to refresh user if needed, or we just rely on local state
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Local state for form
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    website: '',
    avatar_url: '',
    social_links: {
      twitter: '',
      github: '',
      linkedin: '',
    }
  });

  useEffect(() => {
    if (user?.profiles) {
      console.log('SettingsPage: User profile loaded', user.profiles);
      setProfile({
        username: user.profiles.username || '',
        display_name: user.profiles.display_name || '',
        bio: user.profiles.bio || '',
        website: user.profiles.website || '',
        avatar_url: user.profiles.avatar_url || '',
        social_links: {
          twitter: user.profiles.social_links?.twitter || '',
          github: user.profiles.social_links?.github || '',
          linkedin: user.profiles.social_links?.linkedin || '',
        }
      });
    } else {
        console.log('SettingsPage: User profile missing or user not loaded', user);
    }
  }, [user]);

  async function handleSaveProfile() {
    // Optimistic UI update
    setSaving(true);
    setMessage('Settings saved successfully!');
    setError('');

    try {
      // API call in background
      const res = await apiFetch('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
           display_name: profile.display_name,
           bio: profile.bio,
           website: profile.website,
           avatar_url: profile.avatar_url,
           social_links: profile.social_links
        }),
      });

      if (!res.success) {
        // Rollback on error (or just show error)
        setMessage('');
        setError(res.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      setMessage('');
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted">Manage your account and preferences</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-input rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Profile</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-sm text-muted cursor-not-allowed"
                placeholder="username"
              />
              <p className="text-xs text-muted mt-1">Username cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                placeholder="Tell us about yourself"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avatar URL</label>
              <input
                type="text"
                value={profile.avatar_url}
                onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="https://your-website.com"
              />
            </div>

             <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium text-muted">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1 text-muted">Twitter</label>
                        <input
                            type="text"
                            value={profile.social_links.twitter}
                            onChange={(e) => setProfile(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, twitter: e.target.value } 
                            }))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="@username"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-muted">GitHub</label>
                        <input
                            type="text"
                            value={profile.social_links.github}
                            onChange={(e) => setProfile(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, github: e.target.value } 
                            }))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="username"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1 text-muted">LinkedIn</label>
                        <input
                            type="text"
                            value={profile.social_links.linkedin}
                            onChange={(e) => setProfile(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, linkedin: e.target.value } 
                            }))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="https://linkedin.com/in/username"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-input rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Appearance</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors ${
                    theme === t
                      ? 'bg-accent text-white'
                      : 'bg-background border border-border hover:bg-border/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-input rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent" />
              <span className="text-sm">Email notifications for new comments</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent" />
              <span className="text-sm">Email notifications for new followers</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-accent" />
              <span className="text-sm">Weekly digest email</span>
            </label>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-input rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-sm text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <input
                type="text"
                value={user?.role || 'reader'}
                disabled
                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-sm text-muted cursor-not-allowed capitalize"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
