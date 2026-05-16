import { Gender, AgeRange, Prisma } from '@prisma/client';
export declare class UserRepository {
    private prisma;
    constructor();
    findByTelegramId(telegramId: bigint): Promise<Prisma.UserGetPayload<{
        include: {
            preferences: true;
        };
    }> | null>;
    findById(id: string): Promise<Prisma.UserGetPayload<{
        include: {
            preferences: true;
        };
    }> | null>;
    create(data: {
        telegramId: bigint;
        referrerId?: string;
    }): Promise<Prisma.UserGetPayload<{
        include: {
            preferences: true;
        };
    }>>;
    updateGender(userId: string, gender: Gender): Promise<void>;
    updateAgeRange(userId: string, ageRange: AgeRange): Promise<void>;
    updateInterests(userId: string, interests: string[]): Promise<void>;
    updateCountry(userId: string, country: string): Promise<void>;
    updatePreferences(userId: string, preferences: {
        preferredGender?: Gender | null;
        preferredAgeRange?: AgeRange | null;
        preferredCountry?: string | null;
        preferredInterests?: string[];
    }): Promise<void>;
    updateTrustScore(userId: string, delta: number): Promise<void>;
    setVip(userId: string, expiresAt: Date): Promise<void>;
    removeVip(userId: string): Promise<void>;
    ban(userId: string, type: 'TEMPORARY' | 'PERMANENT', reason: string, expiresAt?: Date): Promise<void>;
    unban(userId: string): Promise<void>;
    delete(userId: string): Promise<void>;
    getVipExpiringSoon(hours: number): Promise<Prisma.UserGetPayload<{}>[]>;
    getActiveUsersCount(): Promise<number>;
    count(): Promise<number>;
    countVip(): Promise<number>;
    findBannedUser(telegramId: bigint): Promise<Prisma.UserGetPayload<{}> | null>;
}
export declare const userRepository: UserRepository;
//# sourceMappingURL=user.repository.d.ts.map