'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Trash2, 
  Users,
  TrendingUp,
  User,
  Plus,
  X,
  BarChart2
} from 'lucide-react';
import { UserStatsModal } from '@/components/dashboard/UserStatsModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'reader';
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  can_delete_own_comments?: boolean;
  can_delete_others_comments?: boolean;
}

interface Stats {
  total: number;
  newThisWeek: number;
  byRole: Record<string, number>;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-500',
  editor: 'bg-purple-500/10 text-purple-500',
  author: 'bg-blue-500/10 text-blue-500',
  reader: 'bg-gray-500/10 text-gray-500',
};

const roleIcons: Record<string, typeof Shield> = {
  admin: ShieldCheck,
  editor: Shield,
  author: User,
  reader: User,
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    username: '',
    displayName: '',
    role: 'author',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/users/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole as UserData['role'] } : u
        ));
        setMenuOpen(null);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  }

  async function handleUpdatePermissions(userId: string, permissions: { can_delete_own_comments?: boolean; can_delete_others_comments?: boolean }) {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissions),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, ...permissions } : u
        ));
      }
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/admin/users/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();

      if (res.ok) {
        setShowInvite(false);
        setInviteForm({ email: '', username: '', displayName: '', role: 'author', password: '' });
        fetchUsers();
        fetchStats();
      } else {
        setInviteError(data.error || 'Failed to create user');
      }
    } catch {
      setInviteError('Failed to create user');
    } finally {
      setInviteLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.profiles?.username?.toLowerCase().includes(searchLower) ||
      user.profiles?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <ShieldX className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted">Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border border-border p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Invite User</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 hover:bg-border rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="space-y-4">
              {inviteError && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{inviteError}</div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.username}
                  onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={inviteForm.displayName}
                  onChange={(e) => setInviteForm({ ...inviteForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="author">Author</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Password (auto-generated if empty)</label>
                <input
                  type="password"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-border/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
                >
                  {inviteLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted">Manage user accounts and roles</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-input rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-input rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newThisWeek}</p>
                <p className="text-xs text-muted">New This Week</p>
              </div>
            </div>
          </div>
          <div className="bg-input rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.byRole?.author || 0}</p>
                <p className="text-xs text-muted">Authors</p>
              </div>
            </div>
          </div>
          <div className="bg-input rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.byRole?.admin || 0}</p>
                <p className="text-xs text-muted">Admins</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-input rounded-lg border border-border"> {/* Removed overflow-hidden */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
            <p className="text-muted mt-2">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-muted mx-auto mb-2" />
            <p className="text-muted">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-border/30">
              <tr className="text-left text-sm text-muted">
                <th className="px-4 py-3 font-medium first:rounded-tl-lg">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium w-16 last:rounded-tr-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role] || User;
                return (
                  <tr key={user.id} className="hover:bg-border/20 last:first:rounded-bl-lg last:last:rounded-br-lg">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
                          {user.profiles?.display_name?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.profiles?.display_name || user.email}
                          </p>
                          <p className="text-xs text-muted">
                            {user.profiles?.username ? `@${user.profiles.username}` : user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full capitalize ${roleColors[user.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 relative">
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                            className="p-1 hover:bg-border rounded"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {menuOpen === user.id && (
                            <div className="absolute right-4 top-full mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => {
                                    setSelectedUser(user);
                                    setMenuOpen(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-border/50 w-full text-left"
                              >
                                <BarChart2 className="w-4 h-4" />
                                View Stats
                              </button>
                              <div className="p-2 border-t border-b border-border">
                                <p className="text-xs text-muted px-2 mb-1">Change role</p>
                                {['admin', 'editor', 'author', 'reader'].map(role => (
                                  <button
                                    key={role}
                                    onClick={() => handleUpdateRole(user.id, role)}
                                    className={`w-full text-left px-2 py-1 text-sm rounded capitalize hover:bg-border/50 ${
                                      user.role === role ? 'text-accent' : ''
                                    }`}
                                  >
                                    {role}
                                    {user.role === role && ' ✓'}
                                  </button>
                                ))}
                              </div>
                              <div className="p-2 border-b border-border">
                                <p className="text-xs text-muted px-2 mb-1">Permissions</p>
                                <label className="flex items-center justify-between px-2 py-1 text-sm hover:bg-border/50 rounded cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                  <span>Delete Own Comments</span>
                                  <input 
                                    type="checkbox" 
                                    checked={user.can_delete_own_comments !== false} 
                                    onChange={(e) => handleUpdatePermissions(user.id, { can_delete_own_comments: e.target.checked })}
                                    className="accent-accent"
                                  />
                                </label>
                                <label className="flex items-center justify-between px-2 py-1 text-sm hover:bg-border/50 rounded cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                  <span>Delete Others&apos; Comments</span>
                                  <input 
                                    type="checkbox" 
                                    checked={user.can_delete_others_comments === true} 
                                    onChange={(e) => handleUpdatePermissions(user.id, { can_delete_others_comments: e.target.checked })}
                                    className="accent-accent"
                                  />
                                </label>
                              </div>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 w-full"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <UserStatsModal
            userId={selectedUser.id}
            userName={selectedUser.profiles?.display_name || selectedUser.email}
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
