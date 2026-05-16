import { Gender, AgeRange } from '@prisma/client';
export declare class VipService {
    private env;
    isVip(userId: string): Promise<boolean>;
    updatePreferences(userId: string, preferences: {
        preferredGender?: Gender | null;
        preferredAgeRange?: AgeRange | null;
        preferredCountry?: string | null;
        preferredInterests?: string[];
    }): Promise<void>;
    getPreferences(userId: string): Promise<{
        preferredGender?: Gender | null;
        preferredAgeRange?: AgeRange | null;
        preferredCountry?: string | null;
        preferredInterests?: string[];
    } | null>;
    getVipStatus(userId: string): Promise<{
        isVip: boolean;
        expiresAt?: Date;
        daysRemaining?: number;
    }>;
    cleanupExpiredVip(): Promise<number>;
    getVipFeatures(): string[];
    extendVip(userId: string, hours: number): Promise<Date>;
}
export declare const vipService: VipService;
//# sourceMappingURL=vip.service.d.ts.map