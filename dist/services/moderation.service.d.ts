export declare class ModerationService {
    private redis;
    private env;
    checkRateLimit(userId: string): Promise<boolean>;
    handleReport(reporterId: string, targetId: string, reason: string): Promise<void>;
    handleSkip(userId: string): Promise<void>;
    handleSpam(userId: string): Promise<void>;
    handleAbuse(userId: string, reason: string): Promise<void>;
    private applyAutoBan;
    getTrustScore(userId: string): Promise<number>;
    isUserBanned(userId: string): Promise<boolean>;
    checkMessageSafety(message: string): Promise<{
        isSafe: boolean;
        flagged: boolean;
        reason?: string;
    }>;
    performShadowMatch(userId: string): Promise<boolean>;
    getModerationStats(): Promise<{
        totalReports: number;
        bannedUsers: number;
        avgTrustScore: number;
    }>;
}
export declare const moderationService: ModerationService;
//# sourceMappingURL=moderation.service.d.ts.map