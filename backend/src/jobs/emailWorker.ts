import { Worker, Job } from 'bullmq';
import { connection, QUEUES, EmailJob } from './queues.js';
import { sendEmailDirect } from '../services/email.js';

// Email worker - processes email jobs
export function createEmailWorker() {
  if (!connection) return null;

  const worker = new Worker<EmailJob>(
    QUEUES.EMAIL,
    async (job: Job<EmailJob>) => {
      return sendEmailDirect(job.data);
    },
    { connection }
  );
  
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed. Email type: ${job.data.type}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// Email templates moved to services/email.ts
