import { Worker, Job } from 'bullmq';
export declare class QueueService {
    private connection;
    private queues;
    constructor();
    private getQueue;
    addMatchmakingJob(userId: string, data?: Record<string, unknown>): Promise<void>;
    addVipExpiryJob(userId: string): Promise<void>;
    addCleanupJob(type: string): Promise<void>;
    addReferralJob(referralId: string): Promise<void>;
    closeAll(): Promise<void>;
}
export declare const queueService: QueueService;
export declare function createWorker(name: string, processor: (job: Job) => Promise<void>, options?: {
    concurrency?: number;
}): Worker;
//# sourceMappingURL=queue.service.d.ts.map