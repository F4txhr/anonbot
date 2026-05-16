import { Gender, AgeRange, QueueType, ReportReason, MatchEndedReason, PaymentStatus, ReferralStatus, BanType } from '@prisma/client';
export type { Gender, AgeRange, QueueType, ReportReason, MatchEndedReason, PaymentStatus, ReferralStatus, BanType, };
export interface UserPreferences {
    preferredGender?: Gender | null;
    preferredAgeRange?: AgeRange | null;
    preferredCountry?: string | null;
    preferredInterests?: string[];
}
export interface MatchmakingPreferences {
    gender?: Gender;
    ageRange?: AgeRange;
    country?: string;
    interests?: string[];
}
export interface ActiveMatch {
    matchId: string;
    partnerId: string;
    startedAt: Date;
}
export interface UserState {
    telegramId: bigint;
    currentState: UserStateType;
    activeMatch?: ActiveMatch;
    isSearching?: boolean;
    searchStartedAt?: Date;
}
export type UserStateType = 'NEW' | 'ONBOARDING' | 'SETUP_GENDER' | 'SETUP_AGE' | 'SETUP_INTERESTS' | 'IDLE' | 'SEARCHING' | 'CHATTING';
export interface ReportData {
    reason: ReportReason;
    targetUserId: string;
}
export interface PaymentData {
    starsAmount: number;
    telegramPaymentId?: string;
}
export interface ReferralData {
    referrerId: string;
    referredUserId: string;
}
export interface SessionData {
    userId?: string;
    referrerId?: string;
}
export interface MatchFoundEvent {
    userAId: string;
    userBId: string;
    matchId: string;
}
export interface ChatMessageEvent {
    matchId: string;
    senderId: string;
    messageType: string;
}
export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalMatches: number;
    activeMatches: number;
    totalReports: number;
    totalPayments: number;
    vipUsers: number;
}
export declare const INTERESTS_LIST: readonly ["Gaming", "Music", "Anime", "Coding", "Movies", "Fitness", "Dating", "Travel", "Books", "Memes"];
export type Interest = typeof INTERESTS_LIST[number];
export declare const AGE_RANGES: {
    value: AgeRange;
    label: string;
}[];
export declare const GENDERS: {
    value: Gender;
    label: string;
}[];
export declare const REPORT_REASONS: {
    value: ReportReason;
    label: string;
}[];
//# sourceMappingURL=index.d.ts.map