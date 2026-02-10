import { createEmailWorker } from './emailWorker.js';
import { createNotificationWorker } from './notificationWorker.js';
import { createAnalyticsWorker } from './analyticsWorker.js';
import { scheduleCleanup } from './queues.js';

let workers: any[] = [];

export async function startWorkers() {
  console.log('🚀 Starting background workers...');
  
  try {
    // Create workers
    const emailWorker = createEmailWorker();
    const notificationWorker = createNotificationWorker();
    const analyticsWorker = createAnalyticsWorker();
    
    workers = [emailWorker, notificationWorker, analyticsWorker];
    
    // Schedule recurring jobs
    await scheduleCleanup();
    
    console.log('✅ All workers started successfully');
    console.log('   - Email worker');
    console.log('   - Notification worker');
    console.log('   - Analytics worker');
    
    return workers;
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    throw error;
  }
}

export async function stopWorkers() {
  console.log('🛑 Stopping workers...');
  
  for (const worker of workers) {
    await worker.close();
  }
  
  console.log('✅ All workers stopped');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await stopWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await stopWorkers();
  process.exit(0);
});
