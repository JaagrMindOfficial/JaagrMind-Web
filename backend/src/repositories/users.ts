import { supabase } from '../config/supabase.js';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'author' | 'reader';
  created_at: string;
  last_sign_in_at: string | null;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  can_delete_own_comments?: boolean;
  can_delete_others_comments?: boolean;
}

export const usersRepository = {
  async getAll(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        *,
        profiles(username, display_name, avatar_url)
      `, { count: 'exact' })
      .neq('role', 'reader') // Exclude general readers
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,profiles.username.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      total: count || 0,
      page,
      limit,
    };
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        profiles(username, display_name, avatar_url, bio, website)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data as User;
  },

  async updateRole(userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },

  async updatePermissions(userId: string, permissions: { can_delete_own_comments?: boolean; can_delete_others_comments?: boolean }): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(permissions)
      .eq('id', userId);

    if (error) throw error;
  },

  async delete(userId: string): Promise<void> {
    // Note: This will cascade delete the profile due to FK constraint
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  async getStats() {
    const [totalResult, roleResult, recentResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('role'),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const roleCounts: Record<string, number> = {};
    roleResult.data?.forEach((u: { role: string }) => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });

    return {
      total: totalResult.count || 0,
      newThisWeek: recentResult.count || 0,
      byRole: roleCounts,
    };
  },

  async getUserStats(userId: string) {
    console.log('Fetching stats for user:', userId);
    try {
      const { data: posts, error, count } = await supabase
        .from('posts_with_stats')
        .select('view_count, clap_count', { count: 'exact' })
        .eq('author_id', userId);

      if (error) {
        console.error('Error fetching user stats:', error);
        throw error;
      }

      const totalViews = posts?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;
      const totalClaps = posts?.reduce((sum, post) => sum + (post.clap_count || 0), 0) || 0;

      return {
        totalPosts: count || 0,
        totalViews,
        totalClaps,
      };
    } catch (err) {
      console.error('Unexpected error in getUserStats:', err);
      throw err;
    }
  },

  async getWhoToFollow(userId: string | null, limit = 3) {
    // For now, return random users who are NOT the current user
    // Ideally, exclude users already followed
    let query = supabase
      .from('users')
      .select(`
        *,
        profiles(username, display_name, avatar_url, bio)
      `)
      .neq('role', 'reader') // Only suggest authors/editors/admin
      .limit(limit);

    if (userId) {
      query = query.neq('id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as User[];
  },

  async getFollowing(userId: string, page = 1, limit = 10) {
    // 1. Get IDs of users being followed
    const { data: follows, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .range((page - 1) * limit, page * limit - 1);

    if (followError) throw followError;

    if (!follows || follows.length === 0) {
      return { data: [], total: 0 };
    }

    const followingIds = follows.map(f => f.following_id);

    // 2. Fetch user details
    const { data: users, error: userError, count } = await supabase
      .from('users')
      .select(`
        *,
        profiles(username, display_name, avatar_url, bio)
      `, { count: 'exact' })
      .in('id', followingIds);

    if (userError) throw userError;

    return {
      data: users as User[],
      total: count || 0
    };
  }
};
