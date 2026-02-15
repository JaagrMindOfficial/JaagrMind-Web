import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// Redis connection
// Default to FALSE to prevent crashing without Redis
const enableRedis = process.env.ENABLE_REDIS === 'true'; 
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let connection: Redis | undefined;
let useQueue = false;

if (enableRedis) {
  try {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    console.log('✅ Redis configured (ENABLE_REDIS=true). Connecting...');
    useQueue = true;
    
    connection.on('error', (err) => {
       console.warn('⚠️ Redis connection error:', err.message);
    });

  } catch (e) {
    console.warn('⚠️ Failed to initialize Redis config.', e);
  }
} else {
    console.log('ℹ️ Redis disabled (default). Using direct processing for emails.');
}

// Define queue names
export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics',
} as const;

// Create queues only if Redis is enabled
export const emailQueue = (useQueue && connection) ? new Queue(QUEUES.EMAIL, { connection }) : null;
export const notificationQueue = (useQueue && connection) ? new Queue(QUEUES.NOTIFICATION, { connection }) : null;
export const analyticsQueue = (useQueue && connection) ? new Queue(QUEUES.ANALYTICS, { connection }) : null;

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

import { sendEmailDirect } from '../services/email.js';

// Add job helper functions
export async function sendEmail(data: EmailJob) {
  if (useQueue && emailQueue) {
      try {
        return await emailQueue.add('send-email', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
        });
      } catch (e) {
          console.warn('⚠️ Queue add failed. Falling back to direct send.');
      }
  }
  // Fallback
  return sendEmailDirect(data);
}

export async function sendNotification(data: NotificationJob) {
  if (useQueue && notificationQueue) {
      return notificationQueue.add('send-notification', data);
  }
  // No fallback for notifications yet (they are less critical or handled diff)
  // For now, just log
  if (!useQueue) console.log('Skipping notification (No Redis):', data.type);
}

export async function trackView(postId: string, userId?: string, sessionId?: string) {
  if (useQueue && analyticsQueue) {
      return analyticsQueue.add('track-view', {
        type: 'view',
        postId,
        userId,
        sessionId,
      });
  }
  // Analytics can be skipped if no queue
}

export async function scheduleCleanup() {
  if (useQueue && analyticsQueue) {
      return analyticsQueue.add('cleanup', { type: 'cleanup' }, {
        repeat: { pattern: '0 0 * * *' },
      });
  }
}

// Export connection for workers
export { connection, useQueue };
