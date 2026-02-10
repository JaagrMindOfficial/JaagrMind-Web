import { supabaseAdmin } from '../config/supabase.js';

export interface DailyStat {
  date: string;
  views: number;
  claps: number;
}

export interface PostStats {
  totalViews: number;
  totalClaps: number;
  totalComments: number;
  dailyStats: DailyStat[];
}

export async function getPostStats(postId: string, userId: string): Promise<PostStats> {
  // 1. Verify ownership and get aggregate stats from view (Optimized)
  const { data: post, error: postError } = await supabaseAdmin
    .from('posts_with_stats')
    .select('author_id, view_count, clap_count, comment_count')
    .eq('id', postId)
    .single();

  if (postError || !post) throw new Error('Post not found');
  
  // Verify ownership
  if (post.author_id !== userId) throw new Error('Unauthorized');

  // Use aggregated stats from view
  const totalViews = post.view_count || 0;
  const totalClaps = post.clap_count || 0;
  const totalComments = post.comment_count || 0;

  // 4. Get daily stats (last 30 days) - Using Postgres date_trunc
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Views by day
  const { data: viewsByDay, error: viewsByDayError } = await supabaseAdmin
    .rpc('get_daily_views', { post_uuid: postId, start_date: thirtyDaysAgo.toISOString() });

  // If RPC doesn't exist, fallback to simple fetch and aggregate in JS (slower but safer for now without migration)
  // For this iteration, we will do JS aggregation to avoid complex SQL migrations unless needed.
  
  const { data: recentViews } = await supabaseAdmin
    .from('post_views')
    .select('viewed_at')
    .eq('post_id', postId)
    .gte('viewed_at', thirtyDaysAgo.toISOString());

  const dailyMap = new Map<string, { views: number; claps: number }>();

  // Fill structure with 0s
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap.set(dateStr, { views: 0, claps: 0 });
  }

  // Aggregate Views
  recentViews?.forEach((v: { viewed_at: string }) => {
    const dateStr = v.viewed_at.split('T')[0];
    if (dailyMap.has(dateStr)) {
      dailyMap.get(dateStr)!.views++;
    }
  });

  // Aggregate Claps (Note: claps table has created_at)
  const { data: recentClaps } = await supabaseAdmin
    .from('claps')
    .select('created_at, count')
    .eq('post_id', postId)
    .gte('created_at', thirtyDaysAgo.toISOString());

    recentClaps?.forEach((c: { created_at: string; count: number }) => {
    const dateStr = c.created_at.split('T')[0];
    if (dailyMap.has(dateStr)) {
        dailyMap.get(dateStr)!.claps += (c.count || 0);
    }
    });

  const dailyStats: DailyStat[] = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalViews,
    totalClaps,
    totalComments,
    dailyStats
  };
}
