import { Job } from 'bullmq';
export declare function processVipExpiryJob(job: Job<{
    userId: string;
}>): Promise<void>;
export declare function processCleanupStaleQueueJob(job: Job<{
    minutes: number;
}>): Promise<void>;
export declare function processCleanupStaleMatchesJob(job: Job<{
    minutes: number;
}>): Promise<void>;
export declare function processReferralVerificationJob(job: Job<{
    referralId: string;
}>): Promise<void>;
export declare function processVipExpirationJob(job: Job<unknown>): Promise<void>;
export declare function createVipExpiryScheduler(intervalHours?: number): NodeJS.Timeout;
export declare function createCleanupScheduler(intervalMinutes?: number): NodeJS.Timeout;
export declare function createReferralScheduler(intervalMinutes?: number): NodeJS.Timeout;
//# sourceMappingURL=index.d.ts.map