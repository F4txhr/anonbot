import { Context } from 'grammy';
import { getRedis } from '../config/redis';
import { createLogger } from '../config/logger';
import { matchRepository } from '../repositories/match.repository';
import { getEnv } from '../config/env';

const log = createLogger('relay-service');

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const BLOCKED_EXTENSIONS = ['.apk', '.exe', '.bat', '.sh', '.cmd', '.scr', '.jar', '.msi'];

export class RelayService {
  private redis = getRedis();
  private env = getEnv();

  async relayMessage(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const state = await this.getUserState(userId);
    if (state.state !== 'CHATTING' || !state.matchId) {
      return;
    }

    const match = await matchRepository.findById(state.matchId);
    if (!match || match.endedAt) {
      return;
    }

    const partnerId = match.userAId === userId ? match.userBId : match.userAId;
    const partnerTelegramIdStr = await this.redis.get(`user:telegram:${partnerId}`);

    if (!partnerTelegramIdStr) {
      log.error({ partnerId }, 'Partner Telegram ID not found');
      return;
    }

    const partnerTelegramId = parseInt(partnerTelegramIdStr);

    try {
      await this.relayToPartner(ctx, partnerTelegramId);
    } catch (error) {
      log.error({ err: error, partnerId }, 'Failed to relay message');
    }
  }

  private async getUserState(userId: string): Promise<{
    state: string;
    matchId?: string;
    partnerId?: string;
  }> {
    const key = `user:state:${userId}`;
    const state = await this.redis.hgetall(key);
    return {
      state: state.state || 'IDLE',
      matchId: state.matchId,
      partnerId: state.partnerId,
    };
  }

  private async relayToPartner(ctx: Context, partnerId: number): Promise<void> {
    const message = ctx.message;
    if (!message) return;

    const api = ctx.api;

    if (message.text) {
      await api.sendMessage(partnerId, message.text);
    } else if (message.photo) {
      const photos = message.photo;
      if (photos.length > 0) {
        const largest = photos[photos.length - 1];
        if (largest) {
          const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
          await api.sendPhoto(partnerId, largest.file_id, {
            caption: caption ? `🟢 ${caption}` : undefined,
          });
        }
      }
    } else if (message.video) {
      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendVideo(partnerId, message.video.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.voice) {
      await api.sendVoice(partnerId, message.voice.file_id);
    } else if (message.audio) {
      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendAudio(partnerId, message.audio.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.animation) {
      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendAnimation(partnerId, message.animation.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.sticker) {
      await api.sendSticker(partnerId, message.sticker.file_id);
    } else if (message.document) {
      const doc = message.document;
      const fileName = doc.file_name || '';
      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

      if (BLOCKED_EXTENSIONS.includes(ext)) {
        await api.sendMessage(partnerId, '🟢 This file type is not allowed.');
        return;
      }

      const caption = (message as unknown as Record<string, unknown>)?.caption as string | undefined;
      await api.sendDocument(partnerId, doc.file_id, {
        caption: caption ? `🟢 ${caption}` : undefined,
      });
    } else if (message.video_note) {
      await api.sendVideoNote(partnerId, message.video_note.file_id);
    } else if (message.contact) {
      const contact = message.contact;
      await api.sendContact(partnerId, contact.phone_number, contact.first_name, {
        last_name: contact.last_name,
      });
    } else if (message.location) {
      const location = message.location;
      await api.sendLocation(partnerId, location.latitude, location.longitude);
    }
  }
}

export const relayService = new RelayService();