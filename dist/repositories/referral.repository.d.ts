import { Prisma } from '@prisma/client';
export declare class ReferralRepository {
    private prisma;
    constructor();
    create(data: {
        referrerId: string;
        referredUserId: string;
    }): Promise<Prisma.ReferralGetPayload<{}>>;
    markQualified(referralId: string): Promise<void>;
    markRewarded(referralId: string): Promise<void>;
    markRejected(referralId: string): Promise<void>;
    findByReferredUser(referredUserId: string): Promise<Prisma.ReferralGetPayload<{
        include: {
            referrer: true;
        };
    }> | null>;
    getReferrerStats(referrerId: string): Promise<{
        total: number;
        pending: number;
        qualified: number;
        rewarded: number;
    }>;
    getPendingReferrals(): Promise<Prisma.ReferralGetPayload<{
        include: {
            referredUser: true;
        };
    }>[]>;
}
export declare const referralRepository: ReferralRepository;
//# sourceMappingURL=referral.repository.d.ts.map