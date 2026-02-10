import { Worker, Job } from 'bullmq';
import { connection, QUEUES, AnalyticsJob } from './queues.js';
import { supabase } from '../config/supabase.js';

// Analytics worker - processes view tracking and cleanup jobs
export function createAnalyticsWorker() {
  const worker = new Worker<AnalyticsJob>(
    QUEUES.ANALYTICS,
    async (job: Job<AnalyticsJob>) => {
      const { type, postId, userId, sessionId } = job.data;
      
      if (type === 'view') {
        return handleViewTracking(postId!, userId, sessionId);
      } else if (type === 'cleanup') {
        return handleCleanup();
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Analytics job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Analytics job ${job?.id} failed:`, err.message);
  });

  return worker;
}

async function handleViewTracking(postId: string, userId?: string, sessionId?: string) {
  console.log(`📊 Tracking view for post ${postId}`);
  
  try {
    // Check for recent view to avoid duplicates (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const existingView = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', postId)
      .or(`user_id.eq.${userId || 'null'},session_id.eq.${sessionId || 'null'}`)
      .gte('created_at', fiveMinutesAgo)
      .single();

    if (!existingView.data) {
      // Insert new view
      await supabase
        .from('post_views')
        .insert({
          post_id: postId,
          user_id: userId || null,
          session_id: sessionId || null,
        });

      // Increment view count on post
      await supabase.rpc('increment_view_count', { post_id: postId });
    }

    return { success: true, postId };
  } catch (error) {
    console.error('Failed to track view:', error);
    throw error;
  }
}

async function handleCleanup() {
  console.log(`🧹 Running analytics cleanup`);
  
  try {
    // Delete old anonymous views (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('post_views')
      .delete()
      .is('user_id', null)
      .lt('created_at', thirtyDaysAgo);

    if (error) throw error;

    console.log('✅ Cleanup completed');
    return { success: true };
  } catch (error) {
    console.error('Failed to run cleanup:', error);
    throw error;
  }
}
