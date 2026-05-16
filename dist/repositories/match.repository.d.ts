import { MatchEndedReason, Prisma } from '@prisma/client';
export declare class MatchRepository {
    private prisma;
    constructor();
    create(userAId: string, userBId: string): Promise<Prisma.MatchGetPayload<{}>>;
    findById(matchId: string): Promise<Prisma.MatchGetPayload<{}> | null>;
    findActiveMatch(userId: string): Promise<Prisma.MatchGetPayload<{}> | null>;
    findActiveMatchWithUsers(userId: string): Promise<Prisma.MatchGetPayload<{
        include: {
            userA: true;
            userB: true;
        };
    }> | null>;
    endMatch(matchId: string, reason: MatchEndedReason): Promise<void>;
    getMatchPartner(matchId: string, userId: string): Promise<string | null>;
    getMatchByUserId(userId: string): Promise<Prisma.MatchGetPayload<{
        include: {
            userA: true;
            userB: true;
        };
    }> | null>;
    countMatches(): Promise<number>;
    countActiveMatches(): Promise<number>;
    countUserMatches(userId: string): Promise<number>;
    getStaleMatches(minutes: number): Promise<Prisma.MatchGetPayload<{}>[]>;
    getUserMatchHistory(userId: string, limit?: number): Promise<Prisma.MatchGetPayload<{}>[]>;
}
export declare const matchRepository: MatchRepository;
//# sourceMappingURL=match.repository.d.ts.map