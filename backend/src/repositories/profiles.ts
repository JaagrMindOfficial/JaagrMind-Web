import { supabase } from '../config/supabase.js';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export const profilesRepository = {
  async getByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  },

  async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return null;
    return data;
  },

  async create(profile: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFollowers(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('follows')
      .select(`
        follower:profiles!follows_follower_id_fkey(*)
      `, { count: 'exact' })
      .eq('following_id', userId)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      data: data?.map(f => f.follower) || [],
      total: count || 0,
      page,
      limit,
    };
  },

  async getFollowing(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('follows')
      .select(`
        following:profiles!follows_following_id_fkey(*)
      `, { count: 'exact' })
      .eq('follower_id', userId)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      data: data?.map(f => f.following) || [],
      total: count || 0,
      page,
      limit,
    };
  },

  async follow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error && !error.message.includes('duplicate')) throw error;
  },

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    return !!data;
  },

  async getStats(userId: string) {
    const [followersResult, followingResult, postsResult] = await Promise.all([
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('status', 'published'),
    ]);

    return {
      followers: followersResult.count || 0,
      following: followingResult.count || 0,
      posts: postsResult.count || 0,
    };
  },
};
