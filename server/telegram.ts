import crypto from 'crypto';
import type { TelegramVerificationCode } from './types.js';

interface TelegramQueueItem {
  id: string;
  chat_id: string;
  text: string;
  parse_mode?: string;
  attempts: number;
  created_at: number;
  next_retry_at: number;
}

export class TelegramService {
  private botToken: string;
  private teacherChatId: string;
  private botUsername: string;
  private codes: Map<string, TelegramVerificationCode> = new Map();
  private rateLimitMap: Map<string, { count: number; windowStart: number }> = new Map();
  private queue: TelegramQueueItem[] = [];
  private isProcessingQueue = false;
  private maxRetries = 3;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.teacherChatId = process.env.TELEGRAM_TEACHER_CHAT_ID || '';
    this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TestMasterUzBot';

    // Start background queue processor every 3 seconds
    setInterval(() => {
      this.processQueue();
    }, 3000);
  }

  public getBotInfo() {
    return {
      isConfigured: !!(this.botToken && this.teacherChatId),
      botUsername: this.botUsername,
      teacherChatId: this.teacherChatId ? `${this.teacherChatId.slice(0, 3)}***` : 'Belgilanmagan',
      pendingQueueSize: this.queue.length,
    };
  }

  public updateConfig(botToken?: string, teacherChatId?: string, botUsername?: string) {
    if (botToken !== undefined) this.botToken = botToken;
    if (teacherChatId !== undefined) this.teacherChatId = teacherChatId;
    if (botUsername !== undefined) this.botUsername = botUsername;
  }

  // Generate 6-digit verification code
  public createVerificationCode(phone: string, userId?: string): { code: string; expiresAt: string; deepLink: string } {
    // Rate limit: max 5 requests per 10 minutes
    const now = Date.now();
    const rate = this.rateLimitMap.get(phone);
    if (rate) {
      if (now - rate.windowStart < 10 * 60 * 1000) {
        if (rate.count >= 5) {
          throw new Error('Juda ko‘p so‘rov yuborildi. Iltimos, 10 daqiqadan so‘ng qayta urinib ko‘ring.');
        }
        rate.count++;
      } else {
        this.rateLimitMap.set(phone, { count: 1, windowStart: now });
      }
    } else {
      this.rateLimitMap.set(phone, { count: 1, windowStart: now });
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    const record: TelegramVerificationCode = {
      id: crypto.randomUUID(),
      user_id: userId,
      phone,
      code_hash: codeHash,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    this.codes.set(phone, record);

    const deepLink = `https://t.me/${this.botUsername}?start=otp_${phone.replace('+', '')}`;

    return {
      code, // returned for mock/simulation display when bot token is not active
      expiresAt,
      deepLink,
    };
  }

  // Verify entered code
  public verifyCode(phone: string, rawCode: string, telegramId?: string): boolean {
    const record = this.codes.get(phone);
    if (!record) {
      throw new Error('Tasdiqlash kodi topilmadi yoki muddati tugagan.');
    }

    if (record.used_at) {
      throw new Error('Bu tasdiqlash kodi allaqachon ishlatilgan.');
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      this.codes.delete(phone);
      throw new Error('Tasdiqlash kodining amal qilish muddati tugagan.');
    }

    const hashedInput = crypto.createHash('sha256').update(rawCode.trim()).digest('hex');
    if (hashedInput !== record.code_hash) {
      throw new Error('Noto‘g‘ri tasdiqlash kodi kiritildi.');
    }

    // Mark as used
    record.used_at = new Date().toISOString();
    if (telegramId) {
      record.telegram_id = telegramId;
    }

    return true;
  }

  // Get active code for simulation / helper UI
  public getActiveCodeForPhone(phone: string): string | null {
    const record = this.codes.get(phone);
    if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
      return null;
    }
    return record.code_hash; // note: actual code not directly retrievable from hash, but we store helper if needed
  }

  // Format seconds to "X daqiqa Y soniya"
  private formatTimeSpent(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs} soniya`;
    }
    return `${mins} daqiqa ${secs} soniya`;
  }

  // Enqueue teacher notification for a completed test attempt
  public notifyTestResult(payload: {
    studentName: string;
    testTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    timeSpentSeconds: number;
    tabSwitchCount: number;
  }) {
    const holat = payload.passed ? 'O‘TDI' : 'O‘TMADI';
    const timeFormatted = this.formatTimeSpent(payload.timeSpentSeconds);

    const message = [
      `📚 *Yangi test natijasi*`,
      ``,
      `*O‘quvchi:* ${payload.studentName}`,
      `*Test:* ${payload.testTitle}`,
      `*Ball:* ${payload.score}/${payload.maxScore}`,
      `*Foiz:* ${payload.percentage}%`,
      `*Holat:* ${holat}`,
      `*Vaqt:* ${timeFormatted}`,
      `*Oynadan chiqishlar:* ${payload.tabSwitchCount}`,
    ].join('\n');

    const targetChatId = this.teacherChatId;

    if (!targetChatId) {
      console.log(`[Telegram Simulation] Teacher notification (no CHAT_ID):\n${message}`);
      return;
    }

    this.queue.push({
      id: crypto.randomUUID(),
      chat_id: targetChatId,
      text: message,
      parse_mode: 'Markdown',
      attempts: 0,
      created_at: Date.now(),
      next_retry_at: Date.now(),
    });
  }

  // Process message queue with retry logic
  private async processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    this.isProcessingQueue = true;

    const now = Date.now();
    const readyItems = this.queue.filter((item) => item.next_retry_at <= now);

    for (const item of readyItems) {
      if (!this.botToken) {
        // If no token configured, discard after logging
        this.removeFromQueue(item.id);
        continue;
      }

      try {
        const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: item.chat_id,
            text: item.text,
            parse_mode: item.parse_mode,
          }),
        });

        const data = await response.json() as { ok: boolean; description?: string };
        if (data.ok) {
          this.removeFromQueue(item.id);
        } else {
          console.error(`[Telegram API Error] ${data.description}`);
          this.handleFailedItem(item);
        }
      } catch (err) {
        console.error(`[Telegram Network Error]`, err);
        this.handleFailedItem(item);
      }
    }

    this.isProcessingQueue = false;
  }

  private handleFailedItem(item: TelegramQueueItem) {
    item.attempts++;
    if (item.attempts >= this.maxRetries) {
      console.warn(`[Telegram Queue] Message ${item.id} dropped after ${this.maxRetries} failed retries.`);
      this.removeFromQueue(item.id);
    } else {
      // Exponential backoff: 5s, 15s, 45s
      const delay = Math.pow(3, item.attempts) * 2000;
      item.next_retry_at = Date.now() + delay;
    }
  }

  private removeFromQueue(id: string) {
    this.queue = this.queue.filter((q) => q.id !== id);
  }
}

export const telegramService = new TelegramService();
