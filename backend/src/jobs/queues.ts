import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Define queue names
export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics',
} as const;

// Create queues
export const emailQueue = new Queue(QUEUES.EMAIL, { connection });
export const notificationQueue = new Queue(QUEUES.NOTIFICATION, { connection });
export const analyticsQueue = new Queue(QUEUES.ANALYTICS, { connection });

// Job types
export interface EmailJob {
  type: 'verification' | 'welcome' | 'password-reset' | 'notification';
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationJob {
  type: 'follow' | 'clap' | 'comment' | 'mention';
  userId: string;
  fromUserId: string;
  postId?: string;
  commentId?: string;
  message: string;
}

export interface AnalyticsJob {
  type: 'view' | 'cleanup';
  postId?: string;
  userId?: string;
  sessionId?: string;
}

// Add job helper functions
export async function sendEmail(data: EmailJob) {
  return emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

export async function sendNotification(data: NotificationJob) {
  return notificationQueue.add('send-notification', data);
}

export async function trackView(postId: string, userId?: string, sessionId?: string) {
  return analyticsQueue.add('track-view', {
    type: 'view',
    postId,
    userId,
    sessionId,
  });
}

export async function scheduleCleanup() {
  return analyticsQueue.add('cleanup', { type: 'cleanup' }, {
    repeat: {
      pattern: '0 0 * * *', // Daily at midnight
    },
  });
}

// Export connection for workers
export { connection };
