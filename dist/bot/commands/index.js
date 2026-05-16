"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = startCommand;
exports.showMainMenu = showMainMenu;
exports.helpCommand = helpCommand;
exports.statsCommand = statsCommand;
exports.usersCommand = usersCommand;
exports.reportsCommand = reportsCommand;
exports.broadcastCommand = broadcastCommand;
const user_repository_1 = require("../../repositories/user.repository");
const match_repository_1 = require("../../repositories/match.repository");
const vip_service_1 = require("../../services/vip.service");
const referral_service_1 = require("../../services/referral.service");
const payment_repository_1 = require("../../repositories/payment.repository");
const report_repository_1 = require("../../repositories/report.repository");
const logger_1 = require("../../config/logger");
const env_1 = require("../../config/env");
const log = (0, logger_1.createLogger)('commands');
const env = (0, env_1.getEnv)();
async function startCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    const bannedUser = await user_repository_1.userRepository.findBannedUser(BigInt(telegramId));
    if (bannedUser) {
        await ctx.reply('⛔ You are banned from using this bot.');
        return;
    }
    let user = await user_repository_1.userRepository.findByTelegramId(BigInt(telegramId));
    if (!user) {
        let referrerId;
        if (ctx.match) {
            referrerId = String(ctx.match);
        }
        user = await user_repository_1.userRepository.create({
            telegramId: BigInt(telegramId),
            referrerId,
        });
        if (referrerId && env.ENABLE_REFERRALS) {
            await referral_service_1.referralService.createReferral(referrerId, user.id);
        }
        const welcomeText = `👋 *Welcome to Anonymous Chat!*

Connect with random strangers and chat anonymously.
Your identity is always protected.

📋 *Rules:*
• Be respectful to others
• No sharing personal info
• No spam or abuse
• Follow Telegram's terms

Press *Continue* to set up your profile.`;
        await ctx.reply(welcomeText, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: 'Continue', callback_data: 'onboarding_continue' }]] },
        });
        return;
    }
    await showMainMenu(ctx, user.id);
}
async function showMainMenu(ctx, userId) {
    const user = await user_repository_1.userRepository.findById(userId);
    if (!user)
        return;
    const isVip = await vip_service_1.vipService.isVip(userId);
    const menuText = `🏠 *Main Menu*

Anonymous Chat
Connect with random strangers instantly.
Stay anonymous.
Be respectful.`;
    await ctx.reply(menuText, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔍 Find Partner', callback_data: 'find_partner' }],
                [{ text: '⭐ VIP Membership', callback_data: 'vip_membership' }],
                [{ text: '📨 Invite & Earn', callback_data: 'invite_earn' }],
                [{ text: '⚙️ Settings', callback_data: 'settings' }],
                [{ text: '❓ Help', callback_data: 'help' }],
            ],
        },
    });
}
async function helpCommand(ctx) {
    const helpText = `❓ *Help*

*How it works:*
1. Press "Find Partner" to search for a stranger
2. When matched, chat anonymously
3. Press "Next" to find someone new

*Tips:*
• Stay anonymous - don't share personal info
• Be respectful to your chat partner
• Report bad behavior to help us improve

*VIP Features:*
• Filter by gender, age, interests
• No cooldown between matches
• Priority matching
• Unlimited skips`;
    await ctx.reply(helpText, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '📋 Main Menu', callback_data: 'main_menu' }]],
        },
    });
}
async function statsCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    if (!env.ADMIN_USER_IDS.includes(BigInt(telegramId))) {
        await ctx.reply('⛔ Admin only');
        return;
    }
    const totalUsers = await user_repository_1.userRepository.count();
    const activeUsers = await user_repository_1.userRepository.getActiveUsersCount();
    const vipUsers = await user_repository_1.userRepository.countVip();
    const totalMatches = await match_repository_1.matchRepository.countMatches();
    const activeMatches = await match_repository_1.matchRepository.countActiveMatches();
    const totalReports = await report_repository_1.reportRepository.count();
    const totalPayments = await payment_repository_1.paymentRepository.countCompleted();
    const statsText = `📊 *Bot Statistics*

👥 Users: ${totalUsers}
🟢 Active (24h): ${activeUsers}
⭐ VIP: ${vipUsers}
💬 Total Matches: ${totalMatches}
💭 Active Chats: ${activeMatches}
🚩 Reports: ${totalReports}
💰 Payments: ${totalPayments}`;
    await ctx.reply(statsText, { parse_mode: 'Markdown' });
}
async function usersCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !env.ADMIN_USER_IDS.includes(BigInt(telegramId))) {
        await ctx.reply('⛔ Admin only');
        return;
    }
    const totalUsers = await user_repository_1.userRepository.count();
    const activeUsers = await user_repository_1.userRepository.getActiveUsersCount();
    const vipUsers = await user_repository_1.userRepository.countVip();
    await ctx.reply(`👥 Users:\n• Total: ${totalUsers}\n• Active: ${activeUsers}\n• VIP: ${vipUsers}`);
}
async function reportsCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !env.ADMIN_USER_IDS.includes(BigInt(telegramId))) {
        await ctx.reply('⛔ Admin only');
        return;
    }
    const reports = await report_repository_1.reportRepository.getRecentReports(10);
    const total = await report_repository_1.reportRepository.count();
    let text = `🚩 Reports (${total}):\n\n`;
    for (const report of reports) {
        text += `• ${report.reason} - by user ${report.reporterId.slice(0, 8)}\n`;
    }
    await ctx.reply(text);
}
async function broadcastCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !env.ADMIN_USER_IDS.includes(BigInt(telegramId))) {
        await ctx.reply('⛔ Admin only');
        return;
    }
    const message = ctx.match;
    if (!message) {
        await ctx.reply('Usage: /broadcast <message>');
        return;
    }
    await ctx.reply(`📢 Broadcast queued: "${message}"`);
}
//# sourceMappingURL=index.js.map