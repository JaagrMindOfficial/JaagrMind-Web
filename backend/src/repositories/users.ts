import { supabase, supabaseAdmin } from '../config/supabase.js';

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
    bio?: string;
    website?: string;
  };
  can_delete_own_comments?: boolean;
  can_delete_others_comments?: boolean;
}

export const usersRepository = {
  async getAll(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users_with_stats') // Use the view
      .select(`
        *,
        post_count,
        total_views,
        total_claps,
        follower_count
      `, { count: 'exact' })
      .neq('role', 'reader') // Exclude general readers
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,display_name.ilike.%${search}%`);
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
    if (error) return null;
    return data as User;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      // 1. Find the full profile first
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio, website')
        .eq('username', username)
        .single();

      if (profileError) {
          console.error('Error fetching profile for username:', username, profileError);
          return null;
      }
      if (!profile) {
          return null;
      };

      // 2. Get the user basic details (using admin client to bypass RLS)
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', profile.user_id)
        .single();

      if (userError) {
          console.error('Error fetching user details:', userError);
          // If user entry is missing but profile exists, that's a data integrity issue, but we can't return a User object reliably.
          return null;
      }

      // 3. Construct the combined User object
      const fullUser: User = {
          ...user,
          profiles: {
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              // bio and website are not in the User interface but we fetched them. 
              // The User interface in this file defines profiles with specific fields.
              // We should update the interface if we want to pass bio/website, 
              // OR just pass them and let the controller handle it (controller uses what returns).
              // For now, matching the interface.
          }
      };
      
      // We need to attach bio/website to the returned object so the controller can send it.
      // The User interface in `users.ts` (lines 3-16) does NOT have bio/website in `profiles`.
      // The controller sends `publicProfile`, so we should probably add them to the interface or cast.
      // Since this is a repo method return type `Promise<User | null>`, I should respect that or extend it.
      // The `getById` method selects bio/website but the Interface doesn't have them?
      // Let's check the Interface at the top of the file!
      // Line 9-13: username, display_name, avatar_url. NO bio or website.
      // But getById (line 54) selects bio and website!
      // This means the TypeScript interface is partial/outdated compared to the runtime data.
      // I will return it as `User & { profiles: { bio: string, website: string } }` via casting if needed, 
      // or just update existing interface.
      
      // Let's verify line 54 in getById: `profiles(username, display_name, avatar_url, bio, website)`
      // Yes, it selects them. So the interface is likely loose or I should update it.
      // I will update the interface in a separate edit if needed, for now I will cast to any to attach extra fields
      // to ensure the frontend gets the bio!
      
      (fullUser.profiles as any).bio = profile.bio;
      (fullUser.profiles as any).website = profile.website;

      return fullUser;

    } catch (e) {
        console.error('Exception in getUserByUsername:', e);
        throw e;
    }
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
    try {
      const { data: posts, error, count } = await supabase
        .from('posts_with_stats')
        .select('view_count, clap_count', { count: 'exact' })
        .eq('author_id', userId);

      if (error) {
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
    // Return random users who are NOT the current user and NOT already followed
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
      
      // Get IDs of users already followed
      // Use admin client to ensure we get all follows for filtering
      const { data: follows } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
        
      if (follows && follows.length > 0) {
        const followedIds = follows.map(f => f.following_id);
        // Supabase postgrest-js doesn't have "notIn" for arrays cleanly in all versions, 
        // but .not('id', 'in', `(${followedIds.join(',')})`) works or .filter
        // A safer way without raw query building is to just fetch more and filter in memory if the list is small.
        // But for scalability, let's try the filter method if supported or repeated .neq (not ideal).
        // Best approach for now:
        query = query.not('id', 'in', `(${followedIds.join(',')})`); 
      }
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
  },

  async getAllFollowingIds(userId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (error) throw error;
    return data ? data.map(f => f.following_id) : [];
  },

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    // Use admin client to bypass RLS, since we handle auth in the controller
    const { data: existing } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existing) return; // Idempotent

    const { error } = await supabaseAdmin
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) {
      console.error('Follow User Error:', error);
      throw error;
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    // Use admin client to bypass RLS
    const { error } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
  },
  
  async isFollowing(followerId: string, targetId: string): Promise<boolean> {
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', targetId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    return !!data;
  },

  async getFollowedUserIds(followerId: string, targetIds: string[]): Promise<Set<string>> {
    if (targetIds.length === 0) return new Set();

    const { data, error } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', followerId)
      .in('following_id', targetIds);

    if (error) throw error;

    return new Set(data?.map(f => f.following_id) || []);
  },

  async getFollowerCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) {
        console.error('Error fetching follower count:', error);
        throw error;
      };
      return count || 0;
    } catch (e) {
      console.error('Exception in getFollowerCount:', e);
      return 0; // Return 0 instead of crashing
    }
  }
};
