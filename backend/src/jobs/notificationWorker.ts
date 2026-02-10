import { Worker, Job } from 'bullmq';
import { connection, QUEUES, NotificationJob } from './queues.js';
import { supabase } from '../config/supabase.js';

// Notification worker - processes notification jobs
export function createNotificationWorker() {
  const worker = new Worker<NotificationJob>(
    QUEUES.NOTIFICATION,
    async (job: Job<NotificationJob>) => {
      const { type, userId, fromUserId, postId, commentId, message } = job.data;
      
      console.log(`🔔 Processing notification: ${type} for user ${userId}`);
      
      try {
        // Store notification in database
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            from_user_id: fromUserId,
            type,
            post_id: postId,
            comment_id: commentId,
            message,
            read: false,
          });

        if (error) throw error;

        // TODO: Add push notification support here
        // TODO: Add WebSocket real-time notification here
        
        return { success: true, type, userId };
      } catch (error) {
        console.error('Failed to create notification:', error);
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Notification job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// Notification message templates
export const notificationMessages = {
  follow: (username: string) => `${username} started following you`,
  clap: (username: string, postTitle: string) => `${username} clapped for "${postTitle}"`,
  comment: (username: string, postTitle: string) => `${username} commented on "${postTitle}"`,
  mention: (username: string, postTitle: string) => `${username} mentioned you in "${postTitle}"`,
  reply: (username: string) => `${username} replied to your comment`,
};
