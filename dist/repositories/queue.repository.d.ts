import { QueueType, Prisma } from '@prisma/client';
export declare class QueueRepository {
    private prisma;
    constructor();
    addToQueue(data: {
        userId: string;
        queueType: QueueType;
        preferences?: Record<string, unknown>;
    }): Promise<Prisma.QueueEntryGetPayload<{}>>;
    removeFromQueue(userId: string): Promise<void>;
    findInQueue(userId: string): Promise<Prisma.QueueEntryGetPayload<{}> | null>;
    getQueueCount(queueType: QueueType): Promise<number>;
    getOldestInQueue(queueType: QueueType, limit?: number): Promise<Prisma.QueueEntryGetPayload<{
        include: {
            user: {
                include: {
                    preferences: true;
                };
            };
        };
    }>[]>;
    getStaleEntries(minutes: number): Promise<Prisma.QueueEntryGetPayload<{
        include: {
            user: true;
        };
    }>[]>;
    clearQueue(queueType?: QueueType): Promise<number>;
}
export declare const queueRepository: QueueRepository;
//# sourceMappingURL=queue.repository.d.ts.map