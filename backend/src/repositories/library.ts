import { supabaseAdmin } from '../config/supabase.js';

export const libraryRepository = {
  // --- Saved Posts (Reading List) ---

  async savePost(userId: string, postId: string) {
    const { error } = await supabaseAdmin
      .from('saved_posts')
      .insert({ user_id: userId, post_id: postId });

    // Ignore duplicate key error (already saved)
    if (error && error.code !== '23505') throw error;
  },

  async unsavePost(userId: string, postId: string) {
    const { error } = await supabaseAdmin
      .from('saved_posts')
      .delete()
      .match({ user_id: userId, post_id: postId });

    if (error) throw error;
  },

  async getSavedPosts(userId: string, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Join with posts table
    // Note: This relies on Supabase properly handling the foreign key relationship query
    // We fetch the post details for each saved entry
    const { data, error, count } = await supabaseAdmin
      .from('saved_posts')
      .select(`
        created_at,
        post:posts (
          id,
          title,
          slug,
          cover_url,
          created_at,
          reading_time,
          published_at,
          clap_count:claps_count,
          comment_count:comments_count,
          author:users!author_id (
            id,
            profiles (
              display_name,
              username,
              avatar_url
            )
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data?.map((item: any) => ({
        ...item.post,
        saved_at: item.created_at,
        is_saved: true,
      })) || [],
      total: count || 0
    };
  },

  async checkIsSaved(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('saved_posts')
      .select('id')
      .match({ user_id: userId, post_id: postId })
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // --- Reading History ---

  async addToHistory(userId: string, postId: string) {
    // Upsert: checks for (user_id, post_id) conflict and updates last_read_at
    const { error } = await supabaseAdmin
      .from('reading_history')
      .upsert({ 
        user_id: userId, 
        post_id: postId,
        last_read_at: new Date().toISOString()
      }, { onConflict: 'user_id, post_id' });

    if (error) throw error;
  },

  async getHistory(userId: string, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('reading_history')
      .select(`
        last_read_at,
        post:posts (
          id,
          title,
          slug,
          cover_url,
          created_at,
          reading_time,
          published_at,
          clap_count:claps_count,
          comment_count:comments_count,
          author:users!author_id (
            id,
            profiles (
              display_name,
              username,
              avatar_url
            )
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Transform and inject is_saved status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts = (data || []).map((item: any) => ({
        ...item.post,
        last_read_at: item.last_read_at
    }));

    if (posts.length > 0) {
        const postIds = posts.map((p: any) => p.id);
        const { data: savedPosts } = await supabaseAdmin
            .from('saved_posts')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds);
            
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const savedSet = new Set(savedPosts?.map((sp: any) => sp.post_id));
        posts.forEach((p: any) => {
            p.is_saved = savedSet.has(p.id);
        });
    }

    return {
      data: posts,
      total: count || 0
    };
  },

  // --- Responses (Comments) ---

  async getUserResponses(userId: string, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Assuming there is a 'comments' table
    const { data, error, count } = await supabaseAdmin
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        post:posts (
          id,
          title,
          slug
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0
    };
  },

  // --- Stats for Library Dashboard ---
  
  async getLibraryStats(userId: string) {
    const { count: savedCount, error: savedError } = await supabaseAdmin
      .from('saved_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: historyCount, error: historyError } = await supabaseAdmin
      .from('reading_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (savedError) console.error('Error counting saved posts:', savedError);
    if (historyError) console.error('Error counting history:', historyError);
    
    return {
      savedCount: savedCount || 0,
      historyCount: historyCount || 0
    };
  }
};

