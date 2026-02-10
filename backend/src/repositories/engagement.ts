import { supabaseAdmin } from '../config/supabase.js';
import type { Clap, Comment, Bookmark, Follow } from '../types/index.js';

// ============================================================
// CLAPS
// ============================================================

export async function getPostClaps(postId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('claps')
    .select('count')
    .eq('post_id', postId);

  if (error) throw error;
  return data?.reduce((sum, c) => sum + (c.count || 0), 0) || 0;
}

export async function addClap(
  postId: string,
  userId: string | null,
  sessionId: string | null,
  count: number = 1
): Promise<Clap> {
  // Check for existing clap
  let query = supabaseAdmin
    .from('claps')
    .select('*')
    .eq('post_id', postId);

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: existing } = await query.single();

  if (existing) {
    // Update existing clap (max 50)
    const newCount = Math.min((existing.count || 0) + count, 50);
    const { data, error } = await supabaseAdmin
      .from('claps')
      .update({ count: newCount })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as Clap;
  }

  // Create new clap
  const { data, error } = await supabaseAdmin
    .from('claps')
    .insert({
      post_id: postId,
      user_id: userId,
      session_id: sessionId,
      count: Math.min(count, 50),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Clap;
}

// ============================================================
// COMMENTS
// ============================================================

export async function getPostComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select(`
      *,
      user:users!user_id (
        profiles (
          user_id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Build threaded structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawComments = (data || []) as any[];
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  rawComments.forEach((c) => {
    // Handle nested profile data from users->profiles
    // It might be an array or object depending on relationship, usually array for 1:1 reverse lookup unless single()
    const profile = Array.isArray(c.user?.profiles) 
      ? c.user.profiles[0] 
      : c.user?.profiles;

    const comment: Comment = {
      ...c,
      author: profile || { username: 'Unknown' }, // Fallback
      replies: [],
    };
    
    // Cleanup internal join fields
    delete (comment as any).user;
    
    commentMap.set(c.id, comment);
  });

  rawComments.forEach((c) => {
    const comment = commentMap.get(c.id)!;
    if (c.parent_id) {
      const parent = commentMap.get(c.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function getCommentById(id: string): Promise<Comment | null> {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('*, post:posts(author_id)')
    .eq('id', id)
    .single();

  if (error) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// BOOKMARKS
// ============================================================

export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabaseAdmin
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Bookmark[];
}

export async function addBookmark(userId: string, postId: string): Promise<Bookmark> {
  const { data, error } = await supabaseAdmin
    .from('bookmarks')
    .insert({ user_id: userId, post_id: postId })
    .select()
    .single();

  if (error) throw error;
  return data as Bookmark;
}

export async function removeBookmark(userId: string, postId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
}

export async function isBookmarked(userId: string, postId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('bookmarks')
    .select('user_id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single();

  return !!data;
}

// ============================================================
// FOLLOWS
// ============================================================

export async function followUser(followerId: string, followingId: string): Promise<Follow> {
  const { data, error } = await supabaseAdmin
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single();

  if (error) throw error;
  return data as Follow;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  return !!data;
}

export async function getFollowers(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);

  if (error) throw error;
  return data?.map((f) => f.follower_id) || [];
}

export async function getFollowing(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (error) throw error;
  return data?.map((f) => f.following_id) || [];
}

// ============================================================
// POST VIEWS
// ============================================================

export async function recordView(
  postId: string,
  userId: string | null,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('post_views')
    .insert({
      post_id: postId,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

  if (error) throw error;
}
