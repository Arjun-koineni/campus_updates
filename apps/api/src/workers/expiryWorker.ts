import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { expirePosts } from '../lib/expiry.js';

// Reuse the complete Redis URL (including TLS/password/db) via duplicated clients.
const queue = new Queue('post-expiry', { connection: redis });
const worker = new Worker('post-expiry', async () => {
  const count = await expirePosts();
  if (count) console.info(`Expired ${count} posts`);
}, { connection: redis.duplicate() });

await queue.upsertJobScheduler('expiry-every-minute', { every: 60_000 }, { name: 'expire', data: {}, opts: { removeOnComplete: 10, removeOnFail: 20 } });
console.info('Expiry worker scheduled every minute');
worker.on('failed', (_job, error) => console.error('Expiry job failed', error));

async function shutdown() { await worker.close(); await queue.close(); await redis.quit(); await prisma.$disconnect(); process.exit(0); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
