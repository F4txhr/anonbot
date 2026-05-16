import { Gender, AgeRange, QueueType, ReportReason, MatchEndedReason, PaymentStatus, ReferralStatus, BanType } from '@prisma/client';

export type {
  Gender,
  AgeRange,
  QueueType,
  ReportReason,
  MatchEndedReason,
  PaymentStatus,
  ReferralStatus,
  BanType,
};

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

export type UserStateType =
  | 'NEW'
  | 'ONBOARDING'
  | 'SETUP_GENDER'
  | 'SETUP_AGE'
  | 'SETUP_INTERESTS'
  | 'IDLE'
  | 'SEARCHING'
  | 'CHATTING';

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

export const INTERESTS_LIST = [
  'Gaming',
  'Music',
  'Anime',
  'Coding',
  'Movies',
  'Fitness',
  'Dating',
  'Travel',
  'Books',
  'Memes',
] as const;

export type Interest = typeof INTERESTS_LIST[number];

export const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: 'AGE_18_22', label: '18–22' },
  { value: 'AGE_23_30', label: '23–30' },
  { value: 'AGE_31_40', label: '31–40' },
  { value: 'AGE_40_PLUS', label: '40+' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'NSFW', label: 'NSFW' },
  { value: 'SCAM', label: 'Scam' },
  { value: 'FAKE_BEHAVIOR', label: 'Fake Behavior' },
  { value: 'OTHER', label: 'Other' },
];