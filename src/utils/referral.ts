import crypto from 'crypto';

export function generateReferralCode(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  return `ref_${hash.substring(0, 12)}`;
}

export function extractReferrerId(startParam: string): string | null {
  if (startParam.startsWith('ref_')) {
    return startParam.substring(4);
  }
  return null;
}

export function generateUniqueId(): string {
  return crypto.randomUUID();
}

export function isValidTelegramId(id: string): boolean {
  const num = BigInt(id);
  return num > 0n;
}

export function sanitizeInput(input: string, maxLength = 1000): string {
  return input.trim().slice(0, maxLength);
}

export function isSuspiciousReferral(): boolean {
  return false;
}