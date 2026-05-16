export declare class MatchmakingService {
    private redis;
    private env;
    addToQueue(userId: string, preferences?: {
        gender?: string;
        ageRange?: string;
        country?: string;
        interests?: string[];
    }): Promise<void>;
    removeFromQueue(userId: string): Promise<void>;
    findMatch(userId: string): Promise<{
        matchId: string;
        partnerId: string;
    } | null>;
    private setMatchSession;
    private setCooldown;
    isOnCooldown(userId: string): Promise<boolean>;
    getUserState(userId: string): Promise<{
        state: string;
        matchId?: string;
        partnerId?: string;
        searchStarted?: number;
    }>;
    clearMatch(userId: string): Promise<void>;
    getQueueStats(): Promise<{
        free: number;
        vip: number;
    }>;
    cleanupStaleQueue(minutes?: number): Promise<number>;
    cleanupStaleMatches(minutes?: number): Promise<number>;
}
export declare const matchmakingService: MatchmakingService;
//# sourceMappingURL=matchmaking.service.d.ts.map