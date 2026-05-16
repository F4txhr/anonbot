"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = generateReferralCode;
exports.extractReferrerId = extractReferrerId;
exports.generateUniqueId = generateUniqueId;
exports.isValidTelegramId = isValidTelegramId;
exports.sanitizeInput = sanitizeInput;
exports.isSuspiciousReferral = isSuspiciousReferral;
const crypto_1 = __importDefault(require("crypto"));
function generateReferralCode(userId) {
    const hash = crypto_1.default.createHash('sha256').update(userId).digest('hex');
    return `ref_${hash.substring(0, 12)}`;
}
function extractReferrerId(startParam) {
    if (startParam.startsWith('ref_')) {
        return startParam.substring(4);
    }
    return null;
}
function generateUniqueId() {
    return crypto_1.default.randomUUID();
}
function isValidTelegramId(id) {
    const num = BigInt(id);
    return num > 0n;
}
function sanitizeInput(input, maxLength = 1000) {
    return input.trim().slice(0, maxLength);
}
function isSuspiciousReferral() {
    return false;
}
//# sourceMappingURL=referral.js.map