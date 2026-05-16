import { Context } from 'grammy';
import { userRepository } from '../../repositories/user.repository';
import { matchRepository } from '../../repositories/match.repository';
import { moderationService } from '../../services/moderation.service';
import { matchmakingService } from '../../services/matchmaking.service';
import { vipService } from '../../services/vip.service';
import { referralService } from '../../services/referral.service';
import { paymentRepository } from '../../repositories/payment.repository';
import { reportRepository } from '../../repositories/report.repository';
import { createLogger } from '../../config/logger';
import { getEnv } from '../../config/env';

const log = createLogger('commands');
const env = getEnv();

export async function startCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const bannedUser = await userRepository.findBannedUser(BigInt(telegramId));
  if (bannedUser) {
    await ctx.reply('⛔ You are banned from using this bot.');
    return;
  }

  let user = await userRepository.findByTelegramId(BigInt(telegramId));

  if (!user) {
    let referrerId: string | undefined;
    if (ctx.match) {
      referrerId = String(ctx.match);
    }

    user = await userRepository.create({
      telegramId: BigInt(telegramId),
      referrerId,
    });

    if (referrerId && env.ENABLE_REFERRALS) {
      await referralService.createReferral(referrerId, user.id);
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

export async function showMainMenu(ctx: Context, userId: string): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) return;

  const isVip = await vipService.isVip(userId);

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

export async function helpCommand(ctx: Context): Promise<void> {
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

export async function statsCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  if (!env.ADMIN_USER_IDS.includes(BigInt(telegramId))) {
    await ctx.reply('⛔ Admin only');
    return;
  }

  const totalUsers = await userRepository.count();
  const activeUsers = await userRepository.getActiveUsersCount();
  const vipUsers = await userRepository.countVip();
  const totalMatches = await matchRepository.countMatches();
  const activeMatches = await matchRepository.countActiveMatches();
  const totalReports = await reportRepository.count();
  const totalPayments = await paymentRepository.countCompleted();

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

export async function usersCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId || !env.ADMIN_USER_IDS.includes(BigInt(telegramId))) {
    await ctx.reply('⛔ Admin only');
    return;
  }

  const totalUsers = await userRepository.count();
  const activeUsers = await userRepository.getActiveUsersCount();
  const vipUsers = await userRepository.countVip();

  await ctx.reply(`👥 Users:\n• Total: ${totalUsers}\n• Active: ${activeUsers}\n• VIP: ${vipUsers}`);
}

export async function reportsCommand(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId || !env.ADMIN_USER_IDS.includes(BigInt(telegramId))) {
    await ctx.reply('⛔ Admin only');
    return;
  }

  const reports = await reportRepository.getRecentReports(10);
  const total = await reportRepository.count();

  let text = `🚩 Reports (${total}):\n\n`;

  for (const report of reports) {
    text += `• ${report.reason} - by user ${report.reporterId.slice(0, 8)}\n`;
  }

  await ctx.reply(text);
}

export async function broadcastCommand(ctx: Context): Promise<void> {
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