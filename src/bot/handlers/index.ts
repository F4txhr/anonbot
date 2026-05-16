import { Context } from 'grammy';
import { getRedis } from '../../config/redis';
import { matchmakingService } from '../../services/matchmaking.service';
import { moderationService } from '../../services/moderation.service';
import { userRepository } from '../../repositories/user.repository';
import { matchRepository } from '../../repositories/match.repository';
import { createLogger } from '../../config/logger';

const log = createLogger('message-handlers');
const redis = getRedis();

const BLOCKED_EXTENSIONS = ['.apk', '.exe', '.bat', '.sh', '.cmd', '.scr', '.jar', '.msi'];

export async function handleMessage(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await userRepository.findByTelegramId(BigInt(telegramId));
  if (!user) return;

  const bannedUser = await userRepository.findBannedUser(BigInt(telegramId));
  if (bannedUser) {
    await ctx.reply('⛔ You are banned from using this bot.');
    return;
  }

  const state = await matchmakingService.getUserState(user.id);

  if (state.state !== 'CHATTING' || !state.matchId) {
    return;
  }

  const hasRateLimit = await moderationService.checkRateLimit(user.id);
  if (!hasRateLimit) {
    await ctx.reply('⏳ Please slow down. You are sending messages too fast.');
    return;
  }

  const text = ctx.message?.text;
  if (text) {
    const safety = await moderationService.checkMessageSafety(text);
    if (!safety.isSafe) {
      await ctx.reply(`⚠️ ${safety.reason}`);
      return;
    }
  }

  await relayMessageToPartner(ctx, user.id, state.matchId);
}

async function relayMessageToPartner(ctx: Context, senderId: string, matchId: string): Promise<void> {
  const match = await matchRepository.findById(matchId);
  if (!match || match.endedAt) return;

  const partnerId = match.userAId === senderId ? match.userBId : match.userAId;

  const partnerTelegramIdStr = await redis.get(`user:telegram:${partnerId}`);
  if (!partnerTelegramIdStr) {
    log.warn({ partnerId }, 'Partner Telegram ID not found in Redis');
    return;
  }

  const partnerTelegramId = parseInt(partnerTelegramIdStr);
  const message = ctx.message;
  if (!message) return;

  const api = ctx.api;

  try {
    if (message.text) {
      await api.sendMessage(partnerTelegramId, `🟢 ${message.text}`);
    } else if (message.photo) {
      const photos = message.photo;
      if (photos.length > 0) {
        const largest = photos[photos.length - 1];
        if (largest) {
          const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
          await api.sendPhoto(partnerTelegramId, largest.file_id, {
            caption: caption ? `🟢 ${caption}` : undefined,
          });
        }
      }
    } else if (message.video) {
      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendVideo(partnerTelegramId, message.video.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.voice) {
      await api.sendVoice(partnerTelegramId, message.voice.file_id);
    } else if (message.audio) {
      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendAudio(partnerTelegramId, message.audio.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.animation) {
      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendAnimation(partnerTelegramId, message.animation.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.sticker) {
      await api.sendSticker(partnerTelegramId, message.sticker.file_id);
    } else if (message.document) {
      const doc = message.document;
      const fileName = doc.file_name || '';
      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

      if (BLOCKED_EXTENSIONS.includes(ext)) {
        await api.sendMessage(partnerTelegramId, '🟢 This file type is not allowed.');
        return;
      }

      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendDocument(partnerTelegramId, doc.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.video_note) {
      await api.sendVideoNote(partnerTelegramId, message.video_note.file_id);
    } else if (message.contact) {
      const contact = message.contact;
      await api.sendContact(partnerTelegramId, contact.phone_number, contact.first_name, {
        last_name: contact.last_name,
      });
    } else if (message.location) {
      const location = message.location;
      await api.sendLocation(partnerTelegramId, location.latitude, location.longitude);
    }
  } catch (error) {
    log.error({ err: error, partnerId }, 'Failed to relay message');
  }
}

export async function handleMyChatMember(ctx: Context): Promise<void> {
  log.info({ myChatMember: ctx.myChatMember }, 'My chat member update');
}