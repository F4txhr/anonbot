"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCallback = handleCallback;
const user_repository_1 = require("../../repositories/user.repository");
const match_repository_1 = require("../../repositories/match.repository");
const vip_service_1 = require("../../services/vip.service");
const matchmaking_service_1 = require("../../services/matchmaking.service");
const moderation_service_1 = require("../../services/moderation.service");
const referral_service_1 = require("../../services/referral.service");
const logger_1 = require("../../config/logger");
const types_1 = require("../../types");
const log = (0, logger_1.createLogger)('callbacks');
async function handleCallback(ctx) {
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData)
        return;
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCallbackQuery();
    const user = await user_repository_1.userRepository.findByTelegramId(BigInt(telegramId));
    if (!user) {
        await ctx.reply('Please use /start first');
        return;
    }
    const bannedUser = await user_repository_1.userRepository.findBannedUser(BigInt(telegramId));
    if (bannedUser) {
        await ctx.reply('⛔ You are banned from using this bot.');
        return;
    }
    try {
        await processCallback(ctx, callbackData, user.id);
    }
    catch (error) {
        log.error({ err: error, callbackData, userId: user.id }, 'Callback error');
        await ctx.reply('Something went wrong. Please try again.');
    }
}
async function processCallback(ctx, data, userId) {
    if (data === 'onboarding_continue') {
        await handleOnboardingGender(ctx, userId);
        return;
    }
    if (data.startsWith('set_gender_')) {
        const gender = data.replace('set_gender_', '');
        await user_repository_1.userRepository.updateGender(userId, gender);
        await handleOnboardingAge(ctx, userId);
        return;
    }
    if (data.startsWith('set_age_')) {
        const ageRange = data.replace('set_age_', '');
        await user_repository_1.userRepository.updateAgeRange(userId, ageRange);
        await handleOnboardingInterests(ctx, userId);
        return;
    }
    if (data.startsWith('toggle_interest_')) {
        const interest = data.replace('toggle_interest_', '');
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            return;
        const interests = user.interests.includes(interest)
            ? user.interests.filter(i => i !== interest)
            : [...user.interests, interest];
        await user_repository_1.userRepository.updateInterests(userId, interests);
        await ctx.editMessageReplyMarkup({
            reply_markup: {
                inline_keyboard: buildInterestsKeyboard(interests),
            },
        });
        return;
    }
    if (data === 'interests_done') {
        await finishOnboarding(ctx, userId);
        return;
    }
    if (data === 'main_menu') {
        await showMainMenu(ctx, userId);
        return;
    }
    if (data === 'find_partner') {
        await handleFindPartner(ctx, userId);
        return;
    }
    if (data === 'stop_searching') {
        await handleStopSearching(ctx, userId);
        return;
    }
    if (data === 'next_partner') {
        await handleNextPartner(ctx, userId);
        return;
    }
    if (data === 'stop_chat') {
        await handleStopChat(ctx, userId);
        return;
    }
    if (data === 'report_menu') {
        await showReportMenu(ctx, userId);
        return;
    }
    if (data === 'report_last') {
        await handleReportLastUser(ctx, userId);
        return;
    }
    if (data.startsWith('report_reason_')) {
        const reason = data.replace('report_reason_', '');
        await handleReportReason(ctx, userId, reason);
        return;
    }
    if (data === 'vip_membership') {
        await showVipMenu(ctx, userId);
        return;
    }
    if (data === 'buy_vip') {
        await handleBuyVip(ctx, userId);
        return;
    }
    if (data === 'vip_settings') {
        await showVipSettings(ctx, userId);
        return;
    }
    if (data === 'invite_earn') {
        await showReferralMenu(ctx, userId);
        return;
    }
    if (data === 'settings') {
        await showSettings(ctx, userId);
        return;
    }
    if (data === 'help') {
        await showHelp(ctx, userId);
        return;
    }
    if (data === 'update_gender') {
        await handleUpdateGender(ctx, userId);
        return;
    }
    if (data === 'update_age') {
        await handleUpdateAge(ctx, userId);
        return;
    }
    if (data === 'update_interests') {
        await handleUpdateInterests(ctx, userId);
        return;
    }
    if (data === 'delete_account') {
        await handleDeleteAccount(ctx, userId);
        return;
    }
    log.warn({ data }, 'Unhandled callback');
}
async function handleOnboardingGender(ctx, userId) {
    await ctx.editMessageText('👤 *Select your gender* (optional)\n\nThis helps with matching but is not shown to others.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: types_1.GENDERS.map(g => [{ text: g.label, callback_data: `set_gender_${g.value}` }]),
        },
    });
}
async function handleOnboardingAge(ctx, userId) {
    await ctx.editMessageText('📅 *Select your age range* (optional)\n\nThis helps with matching but is not shown to others.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: types_1.AGE_RANGES.map(a => [{ text: a.label, callback_data: `set_age_${a.value}` }]),
        },
    });
}
async function handleOnboardingInterests(ctx, userId) {
    await ctx.editMessageText('🎯 *Select your interests* (optional)\n\nChoose topics you enjoy discussing.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: buildInterestsKeyboard([]),
        },
    });
}
function buildInterestsKeyboard(selectedInterests) {
    const keyboard = [];
    for (let i = 0; i < types_1.INTERESTS_LIST.length; i += 2) {
        const row = [];
        for (let j = 0; j < 2; j++) {
            if (i + j < types_1.INTERESTS_LIST.length) {
                const interest = types_1.INTERESTS_LIST[i + j];
                if (!interest)
                    continue;
                const isSelected = selectedInterests.includes(interest);
                const label = isSelected ? `✅ ${interest}` : interest;
                row.push({ text: label, callback_data: `toggle_interest_${interest}` });
            }
        }
        if (row.length > 0) {
            keyboard.push(row);
        }
    }
    keyboard.push([{ text: '✅ Done', callback_data: 'interests_done' }]);
    return keyboard;
}
async function finishOnboarding(ctx, userId) {
    await ctx.editMessageText('✅ *Setup Complete!*\n\nYou are now ready to chat anonymously. Press "Find Partner" to start.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '🔍 Find Partner', callback_data: 'find_partner' }]],
        },
    });
}
async function showMainMenu(ctx, userId) {
    const isVip = await vip_service_1.vipService.isVip(userId);
    await ctx.editMessageText(`🏠 *Main Menu*

Anonymous Chat
Connect with random strangers instantly.
Stay anonymous.
Be respectful.`, {
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
async function handleFindPartner(ctx, userId) {
    const state = await matchmaking_service_1.matchmakingService.getUserState(userId);
    if (state.state === 'CHATTING') {
        await ctx.answerCallbackQuery({ text: 'You are already in a chat!' });
        return;
    }
    if (state.state === 'SEARCHING') {
        await ctx.answerCallbackQuery({ text: 'Already searching...' });
        return;
    }
    const isOnCooldown = await matchmaking_service_1.matchmakingService.isOnCooldown(userId);
    if (isOnCooldown) {
        await ctx.reply('⏳ Please wait before searching again.');
        return;
    }
    await matchmaking_service_1.matchmakingService.addToQueue(userId);
    const isVip = await vip_service_1.vipService.isVip(userId);
    const searchText = isVip
        ? '🔍 *Searching with your preferences...*'
        : '🔍 *Searching for a partner...*\n\nPlease wait while we find someone for you.';
    await ctx.editMessageText(searchText, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '⏹️ Stop Searching', callback_data: 'stop_searching' }]],
        },
    });
    const match = await matchmaking_service_1.matchmakingService.findMatch(userId);
    if (match) {
        await ctx.editMessageText('🎉 *Partner found!*\n\nYou are now anonymously connected. Say hello!', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➡️ Next', callback_data: 'next_partner' }],
                    [
                        { text: '🛑 Stop Chat', callback_data: 'stop_chat' },
                        { text: '🚩 Report', callback_data: 'report_menu' },
                    ],
                ],
            },
        });
        await ctx.reply('🎉 *Partner found!*\n\nYou are now anonymously connected.', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➡️ Next', callback_data: 'next_partner' }],
                    [
                        { text: '🛑 Stop Chat', callback_data: 'stop_chat' },
                        { text: '🚩 Report', callback_data: 'report_menu' },
                    ],
                ],
            },
        });
    }
}
async function handleStopSearching(ctx, userId) {
    await matchmaking_service_1.matchmakingService.removeFromQueue(userId);
    await ctx.editMessageText('⏹️ *Search stopped.*\n\nPress "Find Partner" to try again.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔍 Find Partner', callback_data: 'find_partner' }],
                [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
            ],
        },
    });
}
async function handleNextPartner(ctx, userId) {
    const match = await match_repository_1.matchRepository.getMatchByUserId(userId);
    if (match) {
        const partnerId = match.userAId === userId ? match.userBId : match.userAId;
        await match_repository_1.matchRepository.endMatch(match.id, 'SKIPPED');
        const partnerState = await matchmaking_service_1.matchmakingService.getUserState(partnerId);
        if (partnerState.matchId) {
            await matchmaking_service_1.matchmakingService.clearMatch(partnerId);
        }
    }
    await matchmaking_service_1.matchmakingService.addToQueue(userId);
    await ctx.editMessageText('🔍 *Searching for a new partner...*\n\nPlease wait.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '⏹️ Stop Searching', callback_data: 'stop_searching' }]],
        },
    });
    const newMatch = await matchmaking_service_1.matchmakingService.findMatch(userId);
    if (newMatch) {
        await ctx.editMessageText('🎉 *Partner found!*\n\nYou are now anonymously connected.', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➡️ Next', callback_data: 'next_partner' }],
                    [
                        { text: '🛑 Stop Chat', callback_data: 'stop_chat' },
                        { text: '🚩 Report', callback_data: 'report_menu' },
                    ],
                ],
            },
        });
    }
}
async function handleStopChat(ctx, userId) {
    const match = await match_repository_1.matchRepository.getMatchByUserId(userId);
    if (match) {
        const partnerId = match.userAId === userId ? match.userBId : match.userAId;
        await match_repository_1.matchRepository.endMatch(match.id, 'STOPPED');
        const partnerState = await matchmaking_service_1.matchmakingService.getUserState(partnerId);
        if (partnerState.matchId) {
            await matchmaking_service_1.matchmakingService.clearMatch(partnerId);
        }
    }
    await matchmaking_service_1.matchmakingService.clearMatch(userId);
    await ctx.editMessageText('🛑 *Chat ended.*\n\nWhat would you like to do next?', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔍 Find New Partner', callback_data: 'find_partner' }],
                [{ text: '🚩 Report Last User', callback_data: 'report_last' }],
                [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
            ],
        },
    });
}
async function showReportMenu(ctx, userId) {
    const reportReasons = [
        { label: 'Spam', value: 'SPAM' },
        { label: 'Harassment', value: 'HARASSMENT' },
        { label: 'NSFW', value: 'NSFW' },
        { label: 'Scam', value: 'SCAM' },
        { label: 'Fake Behavior', value: 'FAKE_BEHAVIOR' },
        { label: 'Other', value: 'OTHER' },
    ];
    await ctx.editMessageText('🚩 *Report this user*\n\nSelect a reason:', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: reportReasons.map(r => [{ text: r.label, callback_data: `report_reason_${r.value}` }]),
        },
    });
}
async function handleReportReason(ctx, userId, reason) {
    const match = await match_repository_1.matchRepository.getMatchByUserId(userId);
    if (!match) {
        await ctx.editMessageText('No active chat to report.');
        return;
    }
    const targetId = match.userAId === userId ? match.userBId : match.userAId;
    await moderation_service_1.moderationService.handleReport(userId, targetId, reason);
    await match_repository_1.matchRepository.endMatch(match.id, 'BANNED');
    await matchmaking_service_1.matchmakingService.clearMatch(userId);
    await matchmaking_service_1.matchmakingService.clearMatch(targetId);
    await ctx.editMessageText('✅ *Report submitted.*\n\nThank you for helping keep the community safe.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔍 Find New Partner', callback_data: 'find_partner' }],
                [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
            ],
        },
    });
}
async function handleReportLastUser(ctx, userId) {
    const matches = await match_repository_1.matchRepository.getUserMatchHistory(userId, 1);
    if (matches.length === 0) {
        await ctx.editMessageText('No previous chat to report.');
        return;
    }
    const lastMatch = matches[0];
    if (!lastMatch) {
        await ctx.editMessageText('No previous chat to report.');
        return;
    }
    const targetId = lastMatch.userAId === userId ? lastMatch.userBId : lastMatch.userAId;
    await moderation_service_1.moderationService.handleReport(userId, targetId, 'OTHER');
    await ctx.editMessageText('✅ *Report submitted.*\n\nThank you for helping keep the community safe.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '📋 Main Menu', callback_data: 'main_menu' }]],
        },
    });
}
async function showVipMenu(ctx, userId) {
    const isVip = await vip_service_1.vipService.isVip(userId);
    const vipStatus = await vip_service_1.vipService.getVipStatus(userId);
    let text = '⭐ *VIP Membership*\n\n';
    if (isVip && vipStatus.daysRemaining) {
        text += `✅ Active - ${vipStatus.daysRemaining} days remaining\n\n`;
    }
    else {
        text += `💰 Price: 25 Telegram Stars / 7 days\n\n`;
    }
    text += '*VIP Features:*\n';
    text += '• Gender preference filter\n';
    text += '• Age preference filter\n';
    text += '• Interest matching\n';
    text += '• Country preference filter\n';
    text += '• Unlimited skips\n';
    text += '• No cooldown\n';
    text += '• Priority queue';
    await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛒 Buy VIP', callback_data: 'buy_vip' }],
                ...(isVip ? [[{ text: '⚙️ VIP Settings', callback_data: 'vip_settings' }]] : []),
                [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
            ],
        },
    });
}
async function handleBuyVip(ctx, userId) {
    await ctx.reply('💳 To purchase VIP, please send 25 Telegram Stars to the bot.');
}
async function showVipSettings(ctx, userId) {
    const preferences = await vip_service_1.vipService.getPreferences(userId);
    await ctx.editMessageText('⚙️ *VIP Matching Preferences*\n\nSet your preferences for finding partners.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '👫 Preferred Gender', callback_data: 'vip_prefer_gender' }],
                [{ text: '📅 Preferred Age', callback_data: 'vip_prefer_age' }],
                [{ text: '🌍 Preferred Country', callback_data: 'vip_prefer_country' }],
                [{ text: '🎯 Preferred Interests', callback_data: 'vip_prefer_interests' }],
                [{ text: '⬅️ Back', callback_data: 'vip_membership' }],
            ],
        },
    });
}
async function showReferralMenu(ctx, userId) {
    const user = await user_repository_1.userRepository.findById(userId);
    if (!user)
        return;
    const stats = await referral_service_1.referralService.getReferrerStats(userId);
    const text = `📨 *Invite & Earn*\n\n
Invite friends and earn VIP time!
For each friend who completes onboarding and gets matched, you get 12 hours of VIP.

📊 *Your Stats:*
• Total Invites: ${stats.totalInvites}
• Pending: ${stats.pendingInvites}
• Qualified: ${stats.qualifiedInvites}
• VIP Days Earned: ${stats.vipDaysEarned}`;
    const botUsername = 'your_bot_username';
    const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
    await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 Copy Referral Link', url: referralLink }],
                [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
            ],
        },
    });
}
async function showSettings(ctx, userId) {
    const isVip = await vip_service_1.vipService.isVip(userId);
    await ctx.editMessageText('⚙️ *Settings*\n\nUpdate your profile preferences.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '👤 Update Gender', callback_data: 'update_gender' }],
                [{ text: '📅 Update Age', callback_data: 'update_age' }],
                [{ text: '🎯 Update Interests', callback_data: 'update_interests' }],
                ...(isVip ? [[{ text: '⭐ VIP Settings', callback_data: 'vip_settings' }]] : []),
                [{ text: '🗑️ Delete Account', callback_data: 'delete_account' }],
                [{ text: '⬅️ Back', callback_data: 'main_menu' }],
            ],
        },
    });
}
async function handleUpdateGender(ctx, userId) {
    await ctx.editMessageText('👤 *Update Gender*\n\nSelect your gender:', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: types_1.GENDERS.map(g => [{ text: g.label, callback_data: `set_gender_${g.value}` }]),
        },
    });
}
async function handleUpdateAge(ctx, userId) {
    await ctx.editMessageText('📅 *Update Age Range*\n\nSelect your age:', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: types_1.AGE_RANGES.map(a => [{ text: a.label, callback_data: `set_age_${a.value}` }]),
        },
    });
}
async function handleUpdateInterests(ctx, userId) {
    const user = await user_repository_1.userRepository.findById(userId);
    if (!user)
        return;
    await ctx.editMessageText('🎯 *Update Interests*\n\nSelect your interests:', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: buildInterestsKeyboard(user.interests),
        },
    });
}
async function handleDeleteAccount(ctx, userId) {
    await ctx.editMessageText('🗑️ *Delete Account*\n\nAre you sure you want to delete your account? This cannot be undone.', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Yes, Delete', callback_data: 'confirm_delete' }],
                [{ text: '❌ No, Keep', callback_data: 'main_menu' }],
            ],
        },
    });
}
async function showHelp(ctx, userId) {
    await ctx.editMessageText(`❓ *Help*

*How it works:*
1. Press "Find Partner" to search
2. When matched, chat anonymously
3. Press "Next" to find someone new

*Tips:*
• Stay anonymous
• Be respectful
• Report bad behavior`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '📋 Main Menu', callback_data: 'main_menu' }]],
        },
    });
}
//# sourceMappingURL=index.js.map