export declare class ReferralService {
    private env;
    createReferral(referrerId: string, referredUserId: string): Promise<void>;
    processQualifiedReferral(referralId: string): Promise<boolean>;
    rejectReferral(referralId: string): Promise<void>;
    verifyAndRewardReferrals(): Promise<number>;
    getReferrerStats(referrerId: string): Promise<{
        totalInvites: number;
        pendingInvites: number;
        qualifiedInvites: number;
        vipDaysEarned: number;
    }>;
    getReferralLink(referrerId: string, botUsername: string): string;
}
export declare const referralService: ReferralService;
//# sourceMappingURL=referral.service.d.ts.map