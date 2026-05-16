import { Queue, Worker, Job } from 'bullmq';
import { createLogger } from '../config/logger';
import { getEnv } from '../config/env';

const log = createLogger('queue-service');

const QUEUE_NAMES = {
  MATCHMAKING: 'matchmaking',
  VIP_EXPIRY: 'vip-expiry',
  CLEANUP: 'cleanup',
  REFERRAL: 'referral',
} as const;

export class QueueService {
  private connection: { host: string; port: number };
  private queues: Map<string, Queue> = new Map();

  constructor() {
    const env = getEnv();
    this.connection = { host: env.REDIS_HOST, port: env.REDIS_PORT };
  }

  private getQueue(name: string): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue(name, { connection: this.connection });
      this.queues.set(name, queue);
    }
    return queue;
  }

  async addMatchmakingJob(userId: string, data: Record<string, unknown> = {}): Promise<void> {
    const queue = this.getQueue(QUEUE_NAMES.MATCHMAKING);
    await queue.add('find-match', { userId, ...data });
    log.info({ userId }, 'Matchmaking job added');
  }

  async addVipExpiryJob(userId: string): Promise<void> {
    const queue = this.getQueue(QUEUE_NAMES.VIP_EXPIRY);
    await queue.add('check-expiry', { userId });
    log.info({ userId }, 'VIP expiry job added');
  }

  async addCleanupJob(type: string): Promise<void> {
    const queue = this.getQueue(QUEUE_NAMES.CLEANUP);
    await queue.add('cleanup', { type });
    log.info({ type }, 'Cleanup job added');
  }

  async addReferralJob(referralId: string): Promise<void> {
    const queue = this.getQueue(QUEUE_NAMES.REFERRAL);
    await queue.add('verify', { referralId });
    log.info({ referralId }, 'Referral job added');
  }

  async closeAll(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
    log.info('All queues closed');
  }
}

export const queueService = new QueueService();

export function createWorker(
  name: string,
  processor: (job: Job) => Promise<void>,
  options?: { concurrency?: number }
): Worker {
  const env = getEnv();

  const worker = new Worker(name, async (job) => {
    try {
      await processor(job);
    } catch (error) {
      log.error({ err: error, jobId: job.id, name }, 'Job failed');
      throw error;
    }
  }, {
    connection: { host: env.REDIS_HOST, port: env.REDIS_PORT },
    concurrency: options?.concurrency ?? 1,
  });

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id, name }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, name, err }, 'Job failed');
  });

  return worker;
}